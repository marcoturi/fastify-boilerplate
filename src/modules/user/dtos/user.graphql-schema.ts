import { UserRoles } from '#src/modules/user/domain/user.types.ts';

export const userBaseSchema = `
    email: String!
    country: String!
    postalCode: String!
    street: String!
`;

const userSchema = `

  enum UserRole {
    ${Object.values(UserRoles).join('\n    ')}
  }

  type User {
    id: ID!
    role: UserRole!
    ${userBaseSchema}
    createdAt: String!
    updatedAt: String!
  }

`;

export default userSchema;
