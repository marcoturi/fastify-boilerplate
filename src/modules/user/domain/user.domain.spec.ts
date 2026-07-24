import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import userDomain from './user.domain.ts';
import { createUserEvent } from './user.events.ts';
import { UserRoles } from './user.types.ts';

describe('userDomain()', () => {
  it('should return a new user entity as a guest', () => {
    const { entity } = userDomain().createUser({
      email: 'test@test.it',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
    });
    assert.equal(entity.role, UserRoles.guest);
  });

  it('should record a user/created domain event carrying the new entity', () => {
    const { entity, events } = userDomain().createUser({
      email: 'test@test.it',
      country: 'Italy',
      postalCode: '12345',
      street: 'Via Roma',
    });
    assert.equal(events.length, 1);
    assert.equal(events[0].type, createUserEvent.type);
    assert.equal(events[0].type, 'user/created');
    assert.equal(events[0].payload, entity);
  });
});
