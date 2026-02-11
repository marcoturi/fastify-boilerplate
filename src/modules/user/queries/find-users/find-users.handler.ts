import type { UserModel } from '@/modules/user/database/user.repository';
import { userActionCreator } from '@/modules/user';
import { joinConditions } from '@/shared/db/postgres';
import type {
  Paginated,
  PaginatedQueryParams,
} from '@/shared/db/repository.port';
import { paginatedQueryBase } from '@/shared/ddd/query.base';
import { DatabaseErrorException } from '@/shared/exceptions';
import type { UserEntity } from '../../domain/user.types.ts';

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
      const joinedConditions = joinConditions(conditions);
      try {
        const users: { rows: UserModel[]; count: number }[] = await db`
          SELECT
              (SELECT COUNT(*) FROM users ${joinConditions(conditions)}) as count,
            (SELECT json_agg(t.*) FROM
              (SELECT * FROM users)
            AS t) AS rows
          `;
        return {
          data: users[0].rows?.map((user) => userMapper.toDomain(user)) ?? [],
          count: users[0].count,
          limit: query.limit,
          page: query.page,
        };
      } catch (error) {
        throw new DatabaseErrorException(
          `Failed to find users for ${JSON.stringify(joinedConditions)}: `,
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },
    init() {
      queryBus.register(findUsersQuery.type, this.handler);
    },
  };
}
