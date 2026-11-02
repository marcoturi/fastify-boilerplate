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
