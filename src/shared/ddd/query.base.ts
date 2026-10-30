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
  // `??` rather than destructuring defaults, so explicit nulls also get the default
  const limit = props.limit ?? 20;
  const page = props.page ?? 0;
  const orderBy = props.orderBy ?? { field: 'createdAt', param: 'desc' };

  // Computed values come last so caller input (e.g. a stray `offset`) cannot override them
  return { ...props, limit, offset: page * limit, orderBy, page };
}
