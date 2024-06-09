import { idDtoSchema } from '@/shared/api/id.response.dto';
import { Type } from '@sinclair/typebox';

export const baseResponseDtoSchema = Type.Composite([
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
