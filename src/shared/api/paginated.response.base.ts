import { Type } from 'typebox';

export const paginatedResponseBaseSchema = Type.Object({
  count: Type.Number({ example: 5, description: 'Total number of items' }),
  limit: Type.Number({
    example: 10,
    description: 'Number of items per page',
  }),
  page: Type.Number({ example: 0, description: 'Page number' }),
  data: Type.Array(Type.Any()),
});
