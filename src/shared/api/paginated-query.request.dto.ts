import { Type } from 'typebox';

export const paginatedQueryRequestDtoSchema = Type.Object({
  limit: Type.Optional(
    Type.Integer({
      example: 10,
      description: 'Specifies a limit of returned records',
      minimum: 1,
      // Caps what a single request can load: page through larger sets
      maximum: 100,
    }),
  ),
  page: Type.Optional(
    Type.Integer({
      example: 0,
      description: 'Page number',
      minimum: 0,
      maximum: 99_999,
    }),
  ),
});
