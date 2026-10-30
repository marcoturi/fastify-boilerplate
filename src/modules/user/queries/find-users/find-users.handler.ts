import { userActionCreator } from '#src/modules/user/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import type { Paginated } from '#src/shared/db/repository.port.ts';
import { paginatedQueryBase } from '#src/shared/ddd/query.base.ts';
import type { UserEntity } from '../../domain/user.types.ts';
import type { FindUsersRequestDto } from './find-users.schema.ts';

export type FindUsersResult = Paginated<UserEntity>;
export const findUsersQuery = userActionCreator<FindUsersRequestDto, FindUsersResult>(
  'find-all-paginated',
);

export default function findUsersHandler({ queryBus, userRepository }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof findUsersQuery>): Promise<FindUsersResult> {
      // Pick known fields only: the request schema does not reject extra keys (e.g. orderBy)
      const { limit, page, country, postalCode, street } = payload;
      const query = paginatedQueryBase({ limit, page });
      return userRepository.findAllPaginatedFiltered(query, { country, postalCode, street });
    },
    init() {
      queryBus.register(findUsersQuery.type, this.handler);
    },
  };
}
