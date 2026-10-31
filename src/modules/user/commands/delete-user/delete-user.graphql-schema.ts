const userDeleteSchema = `
  type Mutation {
    deleteUser(id: ID!): Boolean!
  }
`;

export default userDeleteSchema;
