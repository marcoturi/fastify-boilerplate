import { type Static, Type } from 'typebox';
import { createUserRequestDtoSchema } from '#src/modules/user/commands/create-user/create-user.schema.ts';
import { paginatedQueryRequestDtoSchema } from '#src/shared/api/paginated-query.request.dto.ts';

// Filters reuse the create-user field schemas, so every user that can be created can be found
export const findUsersRequestDtoSchema = Type.Intersect([
  paginatedQueryRequestDtoSchema,
  Type.Partial(Type.Pick(createUserRequestDtoSchema, ['country', 'postalCode', 'street'])),
]);
export type FindUsersRequestDto = Static<typeof findUsersRequestDtoSchema>;
