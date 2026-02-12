import { Type } from 'typebox';

export const idDtoSchema = Type.Object({
  id: Type.String({
    format: 'uuid',
    example: '2cdc8ab1-6d50-49cc-ba14-54e4ac7ec231',
    description: "Entity's id",
  }),
});
