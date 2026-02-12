// Properties that are needed for a user creation
export interface CreateUserProps {
  email: string;
  country: string;
  postalCode: string;
  street: string;
}

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
