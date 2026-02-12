import { userActionCreator } from '#src/modules/user/index.ts';
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

export default function makeFindUsersQuery({ queryBus, userRepository }: Dependencies) {
  return {
    async handler({ payload }: ReturnType<typeof findUsersQuery>): FindUsersQueryResult {
      const query = paginatedQueryBase(payload);
      return userRepository.findAllPaginatedFiltered(query, {
        country: query.country,
        postalCode: query.postalCode,
        street: query.street,
      });
    },
    init() {
      queryBus.register(findUsersQuery.type, this.handler);
    },
  };
}
