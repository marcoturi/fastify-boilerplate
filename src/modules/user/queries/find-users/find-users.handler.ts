import { userActionCreator } from '#src/modules/user/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import type { Paginated, PaginatedQueryParams } from '#src/shared/db/repository.port.ts';
import { paginatedQueryBase } from '#src/shared/ddd/query.base.ts';
import type { UserEntity } from '../../domain/user.types.ts';

export type FindUsersResult = Paginated<UserEntity>;
export const findUsersQuery = userActionCreator<
  Partial<PaginatedQueryParams> & {
    country?: string;
    postalCode?: string;
    street?: string;
  },
  FindUsersResult
>('find-all-paginated');

export default function makeFindUsersQuery({ queryBus, userRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof findUsersQuery>): Promise<FindUsersResult> {
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
