import { baseResponseDtoSchema } from '@/shared/api/response.base';
import { Static, Type } from '@sinclair/typebox';

export const userResponseDtoSchema = Type.Composite([
  baseResponseDtoSchema,
  Type.Object({
    email: Type.String({
      example: 'test@mail.com',
      format: 'email',
      description: "User's email address",
    }),
    country: Type.String({
      example: 'France',
      description: "User's country of residence",
    }),
    postalCode: Type.String({
      example: '123456',
      description: 'Postal code',
    }),
    street: Type.String({
      example: 'Park Avenue',
      description: 'Street where the user is registered',
    }),
  }),
]);

export type UserResponseDto = Static<typeof userResponseDtoSchema>;
