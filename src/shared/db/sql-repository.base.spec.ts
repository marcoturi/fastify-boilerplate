import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FastifyBaseLogger } from 'fastify';
import {
  AlreadyExistsException,
  DatabaseErrorException,
  NotFoundException,
} from '#src/shared/exceptions/index.ts';
import { sqlRepositoryBase } from './sql-repository.base.ts';

interface Thing {
  id: string;
  name: string;
}

/** Fake postgres.js client: tagged-template calls run `query`, helper calls (identifiers, rows) are inert. */
const fakeDb = (query: () => Promise<unknown[]>) =>
  ((first: unknown) =>
    Array.isArray(first) && 'raw' in first
      ? query()
      : { helper: first }) as unknown as Dependencies['db'];

const props = (query: () => Promise<unknown[]>) => ({
  db: fakeDb(query),
  tableName: 'things',
  mapper: {
    toPersistence: (thing: Thing) => ({ ...thing }) as Record<string, unknown>,
    toDomain: (record: Record<string, unknown>) => record as unknown as Thing,
    toResponse: (thing: Thing) => thing,
  },
  logger: { debug: () => undefined } as unknown as FastifyBaseLogger,
});

const repository = (query: () => Promise<unknown[]>) => sqlRepositoryBase(props(query));

const pgError = (code: string) => Object.assign(new Error(`pg error ${code}`), { code });
const thing: Thing = { id: '1', name: 'a' };

describe('sqlRepositoryBase()', () => {
  describe('update()', () => {
    it('returns the updated entity', async () => {
      const updated = await repository(async () => [{ id: '1', name: 'b' }]).update(thing);
      assert.deepEqual(updated, { id: '1', name: 'b' });
    });

    it('throws NotFoundException when no row matches the id', async () => {
      await assert.rejects(repository(async () => []).update(thing), NotFoundException);
    });

    it('throws AlreadyExistsException on a unique violation', async () => {
      await assert.rejects(
        repository(() => Promise.reject(pgError('23505'))).update(thing),
        AlreadyExistsException,
      );
    });

    it('throws DatabaseErrorException on any other driver error', async () => {
      await assert.rejects(
        repository(() => Promise.reject(pgError('42P01'))).update(thing),
        DatabaseErrorException,
      );
    });
  });

  describe('reads and delete', () => {
    const failing = () => repository(() => Promise.reject(pgError('42P01')));

    for (const [name, call] of [
      ['findOneById', () => failing().findOneById('1')],
      ['findAll', () => failing().findAll()],
      [
        'findAllPaginated',
        () =>
          failing().findAllPaginated({
            limit: 10,
            offset: 0,
            page: 0,
            orderBy: { field: 'id', param: 'asc' },
          }),
      ],
      ['delete', () => failing().delete('1')],
    ] as const) {
      it(`${name}() throws DatabaseErrorException on a driver error`, async () => {
        await assert.rejects(call(), DatabaseErrorException);
      });
    }
  });

  describe('custom methods', () => {
    it('are built from the query helpers and added to the generic ones', async () => {
      const { db, ...rest } = props(async () => [{ id: '1', name: 'a' }]);
      const things = sqlRepositoryBase({ db, ...rest }, ({ where, orderBy }) => ({
        async findByName(name: string) {
          assert.equal(typeof where, 'function');
          assert.equal(typeof orderBy, 'function');
          return db`SELECT * FROM things WHERE name = ${name}`;
        },
      }));
      assert.deepEqual(await things.findByName('a'), [{ id: '1', name: 'a' }]);
      assert.equal(typeof things.findOneById, 'function');
    });

    it('map driver errors like the generic ones', async () => {
      const { db, ...rest } = props(() => Promise.reject(pgError('23505')));
      const things = sqlRepositoryBase({ db, ...rest }, () => ({
        async rename(name: string) {
          await db`UPDATE things SET name = ${name}`;
        },
      }));
      await assert.rejects(things.rename('b'), AlreadyExistsException);
    });
  });

  describe('insert()', () => {
    it('throws AlreadyExistsException on a unique violation', async () => {
      await assert.rejects(
        repository(() => Promise.reject(pgError('23505'))).insert(thing),
        AlreadyExistsException,
      );
    });

    it('throws DatabaseErrorException on any other driver error', async () => {
      await assert.rejects(
        repository(() => Promise.reject(pgError('42P01'))).insert(thing),
        DatabaseErrorException,
      );
    });
  });
});
