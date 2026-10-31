import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { InternalException } from '#src/shared/exceptions/index.ts';
import { type UserEntity, UserRoles } from './domain/user.types.ts';
import userMapper from './user.mapper.ts';

const user: UserEntity = {
  id: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
  email: 'mario.rossi@pec.it',
  country: 'Italy',
  postalCode: '10100',
  street: 'Via Roma',
  role: UserRoles.guest,
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  updatedAt: new Date('2026-01-02T03:04:05.000Z'),
};

describe('userMapper()', () => {
  const mapper = userMapper();

  it('maps an entity to a record and back without losing anything', () => {
    assert.deepEqual(mapper.toDomain(mapper.toPersistence(user)), user);
  });

  it('stores the dates as ISO strings', () => {
    const record = mapper.toPersistence(user);
    assert.equal(record.createdAt, '2026-01-02T03:04:05.000Z');
    assert.equal(record.updatedAt, '2026-01-02T03:04:05.000Z');
  });

  it('sends the dates as ISO strings in the response', () => {
    const response = mapper.toResponse(user);
    assert.equal(response.createdAt, '2026-01-02T03:04:05.000Z');
    assert.equal(response.email, user.email);
  });

  it('refuses to persist a record that breaks the table schema', () => {
    assert.throws(
      () => mapper.toPersistence({ ...user, email: 'not-an-email' }),
      InternalException,
    );
  });
});
