import type { PaginatedQueryParams } from '#src/shared/db/repository.port.ts';

/** The pagination a request asks for, with the defaults filled in and the offset computed */
export function paginatedQuery(
  request: Partial<Omit<PaginatedQueryParams, 'offset'>>,
): PaginatedQueryParams {
  // `??` rather than destructuring defaults, so explicit nulls also get the default
  const limit = request.limit ?? 20;
  const page = request.page ?? 0;
  const orderBy = request.orderBy ?? { field: 'createdAt', param: 'desc' };
  return { limit, page, offset: page * limit, orderBy };
}
