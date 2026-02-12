import { userBaseSchema } from '#src/modules/user/dtos/user.graphql-schema.ts';

const userCreateSchema = `
  input PutUserPayload {
    ${userBaseSchema}
  }

  type Mutation {
    putUser(input: PutUserPayload!): ID!
  }
`;

export default userCreateSchema;
