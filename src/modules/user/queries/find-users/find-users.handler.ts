import type { UserModel } from '#src/modules/user/database/user.repository.ts';
import { userActionCreator } from '#src/modules/user/index.ts';
import { joinConditions } from '#src/shared/db/postgres.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';
import { paginatedQueryBase } from '#src/shared/ddd/query.base.ts';
import type { UserEntity } from '../../domain/user.types.ts';

export type FindUsersQueryResult = Promise<Paginated<UserEntity>>;
export const findUsersQuery = userActionCreator<
  Partial<PaginatedQueryParams> & {
    country?: string;
    postalCode?: string;
    street?: string;
  }
>('find-all-paginated');

export default function makeFindUsersQuery({ db, queryBus, userMapper }: Dependencies) {
  return {
    async handler({ payload }: ReturnType<typeof findUsersQuery>): FindUsersQueryResult {
      const query = paginatedQueryBase(payload);
      const conditions = [
        query.country && db`country = ${query.country}`,
        query.street && db`street = ${query.street}`,
        query.postalCode && db`"postalCode" = ${query.postalCode}`,
      ];
      const users: { rows: UserModel[]; count: number }[] = await db`
          SELECT
            (SELECT COUNT(*) FROM users ${joinConditions(conditions)}) as count,
            (SELECT json_agg(t.*) FROM
              (SELECT * FROM users ${joinConditions(conditions)} LIMIT ${query.limit} OFFSET ${query.offset})
            AS t) AS rows
          `;
      return {
        data: users[0].rows?.map((user) => userMapper.toDomain(user)) ?? [],
        count: users[0].count,
        limit: query.limit,
        page: query.page,
      };
    },
    init() {
      queryBus.register(findUsersQuery.type, this.handler);
    },
  };
}
