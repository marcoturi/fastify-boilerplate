import { Static, Type } from 'typebox';

export const createUserRequestDtoSchema = Type.Object({
  email: Type.String({
    example: 'john@gmail.com',
    description: 'User email address',
    maxLength: 320,
    minLength: 5,
    format: 'email',
  }),
  country: Type.String({
    example: 'France',
    description: 'Country of residence',
    maxLength: 50,
    minLength: 4,
  }),
  postalCode: Type.String({
    example: '10000',
    description: 'Postal code',
    maxLength: 10,
    minLength: 4,
  }),
  street: Type.String({
    example: 'Grande Rue',
    description: 'Street',
    maxLength: 50,
    minLength: 5,
  }),
});

export type CreateUserRequestDto = Static<typeof createUserRequestDtoSchema>;
