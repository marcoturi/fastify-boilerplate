import { type Static, Type } from 'typebox';
import type {
  UserFilters,
  UserRepository,
} from '#src/modules/user/database/user.repository.port.ts';
import { UserRoles } from '#src/modules/user/domain/user.types.ts';
import type { PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

export const userModelSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  email: Type.String({ format: 'email' }),
  country: Type.String({ minLength: 1, maxLength: 255 }),
  postalCode: Type.String({ minLength: 1, maxLength: 20 }),
  street: Type.String({ minLength: 1, maxLength: 255 }),
  role: Type.Enum(UserRoles),
});
export type UserModel = Static<typeof userModelSchema>;

export default function userRepository({
  db,
  userMapper,
  repositoryBase,
}: Dependencies): UserRepository {
  return repositoryBase({ tableName: 'users', mapper: userMapper }, ({ paginate }) => ({
    findAllPaginatedFiltered: (params: PaginatedQueryParams, filters: UserFilters) =>
      paginate(params, [
        filters.country && db`country = ${filters.country}`,
        filters.street && db`street = ${filters.street}`,
        filters.postalCode && db`"postalCode" = ${filters.postalCode}`,
      ]),
  }));
}
