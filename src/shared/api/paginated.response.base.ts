import { type TSchema, Type } from 'typebox';
import type { Paginated } from '#src/shared/db/repository.port.ts';

/** The response schema of a page of `item`s */
export function paginatedResponseSchema<Item extends TSchema>(item: Item) {
  return Type.Object({
    count: Type.Number({ example: 5, description: 'Total number of items' }),
    limit: Type.Number({
      example: 10,
      description: 'Number of items per page',
    }),
    page: Type.Number({ example: 0, description: 'Page number' }),
    data: Type.Array(item),
  });
}

/** Maps the items of a page, e.g. with a mapper's toResponse */
export function mapPage<T, R>(page: Paginated<T>, map: (item: T) => R): Paginated<R> {
  return { ...page, data: page.data.map(map) };
}
