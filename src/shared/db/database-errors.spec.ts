import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AlreadyExistsException,
  DatabaseErrorException,
  NotFoundException,
} from '#src/shared/exceptions/index.ts';
import { mapDatabaseErrors, toDatabaseException } from './database-errors.ts';

const pgError = (code: string) => Object.assign(new Error(`pg error ${code}`), { code });

describe('toDatabaseException()', () => {
  it('maps a unique violation to AlreadyExistsException', () => {
    assert.ok(toDatabaseException(pgError('23505')) instanceof AlreadyExistsException);
  });

  it('maps any other driver error to DatabaseErrorException', () => {
    assert.ok(toDatabaseException(pgError('42P01')) instanceof DatabaseErrorException);
  });

  it('lets an exception that is already ours pass through', () => {
    const notFound = new NotFoundException('Record with id 1 not found');
    assert.equal(toDatabaseException(notFound), notFound);
  });
});

describe('mapDatabaseErrors()', () => {
  const repository = mapDatabaseErrors({
    async find(id: string) {
      return { id };
    },
    async fail() {
      throw pgError('23505');
    },
  });

  it('returns what the method returns', async () => {
    assert.deepEqual(await repository.find('1'), { id: '1' });
  });

  it('turns a driver error into a domain exception', async () => {
    await assert.rejects(repository.fail(), AlreadyExistsException);
  });
});
