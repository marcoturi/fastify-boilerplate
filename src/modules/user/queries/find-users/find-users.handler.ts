import { UserEntity } from '../../domain/user.types';
import { userActionCreator } from '@/modules/user';
import { UserModel } from '@/modules/user/database/user.repository';
import { joinConditions } from '@/shared/db/postgres';
import { Paginated, PaginatedQueryParams } from '@/shared/db/repository.port';
import { paginatedQueryBase } from '@/shared/ddd/query.base';

export type FindUsersQueryResult = Promise<Paginated<UserEntity>>;
export const findUsersQuery = userActionCreator<
  Partial<PaginatedQueryParams> & {
    country?: string;
    postalCode?: string;
    street?: string;
  }
>('find-all-paginated');

export default function makeFindUsersQuery({
  db,
  queryBus,
  userMapper,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: ReturnType<typeof findUsersQuery>): FindUsersQueryResult {
      const query = paginatedQueryBase(payload);
      const conditions = [
        query.country && `country = ${query.country}`,
        query.street && `street = ${query.street}`,
        query.postalCode && `postalCode = ${query.postalCode}`,
      ];
      const users: { rows: UserModel[]; count: number }[] = await db`
          SELECT
            (SELECT COUNT(*) FROM users ${joinConditions(conditions)}) as count,
            (SELECT json_agg(t.*) FROM
              (SELECT * FROM users ${joinConditions(conditions)} LIMIT ${query.limit} OFFSET ${query.offset})
            AS t) AS  rows
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
