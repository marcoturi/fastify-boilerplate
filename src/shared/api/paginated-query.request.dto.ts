import { Type } from '@sinclair/typebox';

export const paginatedQueryRequestDtoSchema = Type.Object({
  limit: Type.Optional(
    Type.Number({
      example: 10,
      description: 'Specifies a limit of returned records',
      minimum: 0,
      maximum: 99_999,
    }),
  ),
  page: Type.Optional(
    Type.Number({
      example: 0,
      description: 'Page number',
      minimum: 0,
      maximum: 99_999,
    }),
  ),
});
