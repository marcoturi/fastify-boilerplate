import { type Static, Type } from 'typebox';
import type {
  UserFilters,
  UserRepository,
} from '#src/modules/user/database/user.repository.port.ts';
import { type UserEntity, UserRoles } from '#src/modules/user/domain/user.types.ts';
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
  // where/orderBy are query helpers, not repository methods: keep them out of the spread
  const { where, orderBy, ...base } = repositoryBase({ tableName, mapper: userMapper });
  return {
    ...base,

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
          (SELECT COUNT(*) FROM users ${where(conditions)}) as count,
          (SELECT json_agg(t.* ${orderBy(params.orderBy)}) FROM
            (SELECT * FROM users ${where(conditions)} ${orderBy(params.orderBy)}
              LIMIT ${params.limit} OFFSET ${params.offset})
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
