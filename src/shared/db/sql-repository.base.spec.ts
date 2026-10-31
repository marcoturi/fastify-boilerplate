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

const repository = (query: () => Promise<unknown[]>) =>
  sqlRepositoryBase<Thing, Record<string, unknown>>({
    db: fakeDb(query),
    tableName: 'things',
    mapper: {
      toPersistence: (thing) => ({ ...thing }),
      toDomain: (record) => record as unknown as Thing,
      toResponse: (thing) => thing,
    },
    logger: { debug: () => undefined } as unknown as FastifyBaseLogger,
  });

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
