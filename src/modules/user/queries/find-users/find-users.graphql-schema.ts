const userSchema = `
  type UserPaginatedResponse {
    page: Int!
    count: Int!
    limit: Int!
    data: [User]!
  }

  type Query {
    findUsers(limit: Int, page: Int, country: String, postalCode: String, street: String): UserPaginatedResponse!
  }
`;

export default userSchema;
