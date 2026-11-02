import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import { userActionCreator } from '#src/modules/user/user.action-creator.ts';
import type { Paginated } from '#src/shared/db/repository.port.ts';
import { paginatedQuery } from '#src/shared/ddd/query.base.ts';
import type { FindUsersRequestDto } from './find-users.schema.ts';

export const findUsersQuery = userActionCreator<FindUsersRequestDto, Paginated<UserEntity>>(
  'find-all-paginated',
);

export default function findUsersHandler({ queryBus, userRepository }: Dependencies) {
  return {
    init() {
      queryBus.register(findUsersQuery, async ({ payload }) => {
        // Pick known fields only: the request schema does not reject extra keys (e.g. orderBy)
        const { limit, page, country, postalCode, street } = payload;
        const query = paginatedQuery({ limit, page });
        return userRepository.findAllPaginatedFiltered(query, { country, postalCode, street });
      });
    },
  };
}
