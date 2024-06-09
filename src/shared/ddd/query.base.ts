type OrderBy = {
  field: string | boolean;
  param: 'asc' | 'desc';
};

type PaginatedQueryParams = {
  limit?: number;
  offset?: number;
  orderBy?: OrderBy;
  page?: number;
};

type PaginatedQueryBaseI<TProps> = TProps & {
  limit: number;
  offset: number;
  orderBy: OrderBy;
  page: number;
};

/**
 * Base class for paginated queries
 */
export function paginatedQueryBase<TProps extends PaginatedQueryParams>(
  props: TProps,
): PaginatedQueryBaseI<TProps> {
  const {
    limit = 20,
    page = 0,
    orderBy = { field: true, param: 'desc' },
  } = props;
  const offset = page ? page * limit : 0;

  return {
    limit,
    offset,
    orderBy,
    page,
    ...props,
  };
}
