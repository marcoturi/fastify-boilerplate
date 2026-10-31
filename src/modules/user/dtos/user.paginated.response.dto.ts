import { userResponseDtoSchema } from '#src/modules/user/dtos/user.response.dto.ts';
import { paginatedResponseSchema } from '#src/shared/api/paginated.response.base.ts';

export const userPaginatedResponseSchema = paginatedResponseSchema(userResponseDtoSchema);
