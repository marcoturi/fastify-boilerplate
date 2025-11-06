import { userResponseDtoSchema } from '@/modules/user/dtos/user.response.dto';
import { paginatedResponseBaseSchema } from '@/shared/api/paginated.response.base';
import { Type } from 'typebox';

export const userPaginatedResponseSchema = Type.Intersect([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(Type.Optional(userResponseDtoSchema)),
  }),
]);
