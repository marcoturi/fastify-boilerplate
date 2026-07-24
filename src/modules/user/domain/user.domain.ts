import { randomUUID } from 'node:crypto';
import { createUserEvent } from '#src/modules/user/domain/user.events.ts';
import {
  type CreateUserProps,
  type UserEntity,
  UserRoles,
} from '#src/modules/user/domain/user.types.ts';
import { type DomainResult, withEvents } from '#src/shared/ddd/aggregate.ts';

export default function userDomain() {
  return {
    createUser: (create: CreateUserProps): DomainResult<UserEntity> => {
      const now = new Date();

      const user: UserEntity = {
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        ...create,
        role: UserRoles.guest,
      };

      // Record the domain event; the command handler publishes it after persistence.
      return withEvents(user, [createUserEvent(user)]);
    },
  };
}
