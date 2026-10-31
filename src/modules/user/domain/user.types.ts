/**
 * `UserRoles` is both a value object (for runtime enum-like access, e.g. `UserRoles.admin`)
 * and a type (union of `'admin' | 'moderator' | 'guest'`).
 * This "const object + derived type" pattern is the idiomatic TypeScript replacement for enums.
 */
export const UserRoles = {
  admin: 'admin',
  moderator: 'moderator',
  guest: 'guest',
} as const;
export type UserRoles = (typeof UserRoles)[keyof typeof UserRoles];

export interface UserEntity {
  id: string;
  email: string;
  country: string;
  postalCode: string;
  street: string;
  role: UserRoles;
  createdAt: Date;
  updatedAt: Date;
}

/** What a client provides to create a user: the rest is generated */
export type CreateUserProps = Pick<UserEntity, 'email' | 'country' | 'postalCode' | 'street'>;
