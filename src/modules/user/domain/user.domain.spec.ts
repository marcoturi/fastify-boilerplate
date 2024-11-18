import userDomain from './user.domain';
import { UserRoles } from './user.types';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('userDomain()', () => {
  it('should return a new user entity', () => {
    const user = userDomain().createUser({
      email: 'test@test.it',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
    });
    assert.equal(user.role, UserRoles.guest);
  });
});
