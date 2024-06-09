import { userResponseDtoSchema } from '@/modules/user/dtos/user.response.dto';
import { paginatedResponseBaseSchema } from '@/shared/api/paginated.response.base';
import { Type } from '@sinclair/typebox';

export const userPaginatedResponseSchema = Type.Composite([
  paginatedResponseBaseSchema,
  Type.Object({
    data: Type.Array(Type.Optional(userResponseDtoSchema)),
  }),
]);
