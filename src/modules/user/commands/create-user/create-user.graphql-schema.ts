import { userBaseSchema } from '#src/modules/user/dtos/user.graphql-schema.ts';

const userCreateSchema = `
  input CreateUserInput {
    ${userBaseSchema}
  }

  type Mutation {
    createUser(input: CreateUserInput!): ID!
  }
`;

export default userCreateSchema;
