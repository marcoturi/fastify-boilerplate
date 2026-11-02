import { randomUUID } from 'node:crypto';
import {
  type CreateUserProps,
  type UserEntity,
  UserRoles,
} from '#src/modules/user/domain/user.types.ts';

export default function userDomain() {
  return {
    createUser: (create: CreateUserProps) => {
      const now = new Date();

      // Generated fields come after the spread, so the input cannot set them
      const user: UserEntity = {
        ...create,
        id: randomUUID(),
        createdAt: now,
        updatedAt: now,
        role: UserRoles.guest,
      };

      return user;
    },
  };
}
