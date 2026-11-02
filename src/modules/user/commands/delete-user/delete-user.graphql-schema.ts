const deleteUserGraphqlSchema = `
  extend type Mutation {
    deleteUser(id: ID!): Boolean!
  }
`;

export default deleteUserGraphqlSchema;
