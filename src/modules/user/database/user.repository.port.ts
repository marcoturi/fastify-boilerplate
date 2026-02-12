import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import type {
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';

export interface UserFilters {
  country?: string;
  postalCode?: string;
  street?: string;
}

export interface UserRepository extends RepositoryPort<UserEntity> {
  findOneByEmail(email: string): Promise<UserEntity | undefined>;
  findAllPaginatedFiltered(
    params: PaginatedQueryParams,
    filters: UserFilters,
  ): Promise<Paginated<UserEntity>>;
}
