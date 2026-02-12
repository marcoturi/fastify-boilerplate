import type { OrderBy } from '#src/shared/db/repository.port.ts';

interface PaginatedQueryParams {
  limit?: number;
  offset?: number;
  orderBy?: OrderBy;
  page?: number;
}

type PaginatedQueryBaseI<TProps> = TProps & {
  limit: number;
  offset: number;
  orderBy: OrderBy;
  page: number;
};

/**
 * Provides defaults for paginated query parameters
 */
export function paginatedQueryBase<TProps extends PaginatedQueryParams>(
  props: TProps,
): PaginatedQueryBaseI<TProps> {
  const { limit = 20, page = 0, orderBy = { field: 'createdAt', param: 'desc' } } = props;
  const offset = page * limit;

  return {
    limit,
    offset,
    orderBy,
    page,
    ...props,
  };
}
