import { Type } from 'typebox';
import { userResponseDtoSchema } from '#src/modules/user/dtos/user.response.dto.ts';
import { paginatedResponseBaseSchema } from '#src/shared/api/paginated.response.base.ts';

export const userPaginatedResponseSchema = Type.Intersect([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(Type.Optional(userResponseDtoSchema)),
  }),
]);
