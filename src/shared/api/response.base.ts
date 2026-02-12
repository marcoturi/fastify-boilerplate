import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import { Type } from 'typebox';

export const baseResponseDtoSchema = Type.Intersect([
  idDtoSchema,
  Type.Object({
    createdAt: Type.String({
      example: '2020-11-24T17:43:15.970Z',
      description: 'Entity creation date',
    }),
    updatedAt: Type.String({
      example: '2020-11-24T17:43:15.970Z',
      description: 'Entity last update date',
    }),
  }),
]);
