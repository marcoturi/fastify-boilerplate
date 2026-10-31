const deleteUserGraphqlSchema = `
  type Mutation {
    deleteUser(id: ID!): Boolean!
  }
`;

export default deleteUserGraphqlSchema;
