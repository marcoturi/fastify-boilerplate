import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

/** Fake postgres.js client: a tagged-template call runs `query` once awaited, like a real query
 *  (so fragments, never awaited, run nothing); helper calls (identifiers, rows) are inert. */
const fakeDb = (query: () => Promise<unknown[]>) =>
  ((first: unknown) =>
    Array.isArray(first) && 'raw' in first
      ? // biome-ignore lint/suspicious/noThenProperty: a lazy thenable, as postgres.js queries are
        { then: (resolve: never, reject: never) => query().then(resolve, reject) }
      : { helper: first }) as unknown as Dependencies['db'];

const props = {
  tableName: 'things',
  mapper: {
    toPersistence: (thing: Thing) => ({ ...thing }) as Record<string, unknown>,
    toDomain: (record: Record<string, unknown>) => record as unknown as Thing,
    toResponse: (thing: Thing) => thing,
  },
};

const repository = (query: () => Promise<unknown[]>) => sqlRepositoryBase(fakeDb(query))(props);

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
      const db = fakeDb(async () => [{ id: '1', name: 'a' }]);
      const things = sqlRepositoryBase(db)(props, ({ paginate }) => ({
        async findByName(name: string) {
          assert.equal(typeof paginate, 'function');
          return db`SELECT * FROM things WHERE name = ${name}`;
        },
      }));
      assert.deepEqual(await things.findByName('a'), [{ id: '1', name: 'a' }]);
      assert.equal(typeof things.findOneById, 'function');
    });

    it('map driver errors like the generic ones', async () => {
      const db = fakeDb(() => Promise.reject(pgError('23505')));
      const things = sqlRepositoryBase(db)(props, () => ({
        async rename(name: string) {
          await db`UPDATE things SET name = ${name}`;
        },
      }));
      await assert.rejects(things.rename('b'), AlreadyExistsException);
    });
  });

  describe('findAllPaginated()', () => {
    const params = {
      limit: 10,
      offset: 0,
      page: 0,
      orderBy: { field: 'id', param: 'asc' },
    } as const;

    it('returns the page and the total count from a single query', async () => {
      let queries = 0;
      const page = await repository(async () => {
        queries++;
        return [{ rows: [thing], count: '7' }];
      }).findAllPaginated(params);
      assert.equal(queries, 1);
      assert.deepEqual(page, { data: [thing], count: 7, limit: 10, page: 0 });
    });

    it('returns an empty page when no row matches', async () => {
      const page = await repository(async () => [{ rows: null, count: '0' }]).findAllPaginated(
        params,
      );
      assert.deepEqual(page.data, []);
      assert.equal(page.count, 0);
    });
  });

  describe('delete()', () => {
    // postgres.js resolves a query to its rows, with the number of affected rows in `count`
    const deleting = (count: number) => repository(async () => Object.assign([], { count }));

    it('returns true when a row was deleted, false when none matched the id', async () => {
      assert.equal(await deleting(1).delete('1'), true);
      assert.equal(await deleting(0).delete('1'), false);
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
