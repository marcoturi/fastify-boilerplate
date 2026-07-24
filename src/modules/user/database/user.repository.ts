import { type Static, Type } from 'typebox';
import type {
  UserFilters,
  UserRepository,
} from '#src/modules/user/database/user.repository.port.ts';
import { type UserEntity, UserRoles } from '#src/modules/user/domain/user.types.ts';
import { joinConditions } from '#src/shared/db/postgres.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

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
        await db`SELECT * FROM ${db(tableName)} WHERE email = ${email} LIMIT 1`;
      return user ? userMapper.toDomain(user) : undefined;
    },

    async findAllPaginatedFiltered(
      params: PaginatedQueryParams,
      filters: UserFilters,
    ): Promise<Paginated<UserEntity>> {
      const conditions = [
        filters.country && db`country = ${filters.country}`,
        filters.street && db`street = ${filters.street}`,
        filters.postalCode && db`"postalCode" = ${filters.postalCode}`,
      ];
      const [result]: { rows: UserModel[] | null; count: number }[] = await db`
        SELECT
          (SELECT COUNT(*) FROM users ${joinConditions(conditions)}) as count,
          (SELECT json_agg(t.*) FROM
            (SELECT * FROM users ${joinConditions(conditions)} LIMIT ${params.limit} OFFSET ${params.offset})
          AS t) AS rows
      `;
      return {
        data: result?.rows?.map((user) => userMapper.toDomain(user)) ?? [],
        count: Number(result?.count ?? 0),
        limit: params.limit,
        page: params.page,
      };
    },
  };
}
