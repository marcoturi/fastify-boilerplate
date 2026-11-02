import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import userDomain from './user.domain.ts';
import { UserRoles } from './user.types.ts';

describe('userDomain()', () => {
  it('should return a new user entity as a guest', () => {
    const entity = userDomain().createUser({
      email: 'test@test.it',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
    });
    assert.equal(entity.role, UserRoles.guest);
  });

  it('should generate the id and dates even when the input carries them', () => {
    const forged = {
      email: 'test@test.it',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
      id: 'chosen-by-the-client',
      createdAt: '2000-01-01',
      role: UserRoles.admin,
    };
    const entity = userDomain().createUser(forged);
    assert.notEqual(entity.id, forged.id);
    assert.ok(entity.createdAt instanceof Date);
    assert.equal(entity.role, UserRoles.guest);
  });
});
