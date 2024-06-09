import { userBaseSchema } from '@/modules/user/dtos/user.graphql-schema';

const userCreateSchema = `
  input PutUserPayload {
    ${userBaseSchema}
  }

  type Mutation {
    putUser(input: PutUserPayload!): ID!
  }
`;

export default userCreateSchema;
