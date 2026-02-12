import type { UserRepository } from '#src/modules/user/database/user.repository.port.ts';
import { type UserEntity, UserRoles } from '#src/modules/user/domain/user.types.ts';
import { type Static, Type } from 'typebox';

export const userSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  email: Type.String({ format: 'email' }),
  country: Type.String({ minLength: 1, maxLength: 255 }),
  postalCode: Type.String({ minLength: 1, maxLength: 20 }),
  street: Type.String({ minLength: 1, maxLength: 255 }),
  role: Type.Enum(UserRoles),
});
export type UserModel = Static<typeof userSchema>;

export default function userRepository({
  db,
  userMapper,
  repositoryBase,
}: Dependencies): UserRepository {
  const tableName = 'users';
  return {
    ...repositoryBase({ tableName, mapper: userMapper }),
    async findOneByEmail(email: string): Promise<UserEntity | undefined> {
      const [user]: [UserModel?] =
        await db`SELECT * FROM ${tableName} WHERE email = ${email} LIMIT 1`;
      return user ? userMapper.toDomain(user) : undefined;
    },
  };
}
