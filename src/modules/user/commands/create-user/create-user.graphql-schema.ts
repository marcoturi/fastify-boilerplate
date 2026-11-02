import { userBaseSchema } from '#src/modules/user/dtos/user.graphql-schema.ts';

const createUserGraphqlSchema = `
  input CreateUserInput {
    ${userBaseSchema}
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): ID!
  }
`;

export default createUserGraphqlSchema;
