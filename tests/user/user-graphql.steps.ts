import assert from 'node:assert';
import { type DataTable, Given, Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

interface FindUsersData {
  findUsers: {
    page: number;
    count: number;
    limit: number;
    data: { id: string; country: string; createdAt: string; updatedAt: string }[];
  };
}

const createUserMutation = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input)
  }
`;

const deleteUserMutation = `
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

const findUsersQuery = `
  query FindUsers($limit: Int, $page: Int, $country: String, $postalCode: String, $street: String) {
    findUsers(limit: $limit, page: $page, country: $country, postalCode: $postalCode, street: $street) {
      page
      count
      limit
      data { id country createdAt updatedAt }
    }
  }
`;

function sendGraphQL(world: ICustomWorld, query: string, variables: Record<string, unknown> = {}) {
  return world.server.inject({ method: 'POST', url: '/graphql', body: { query, variables } });
}

/** The value of the single field of a GraphQL response, or the errors when it failed. */
function fieldOf(world: ICustomWorld) {
  const body = world.context.latestResponse!.json<GraphQLResponse<Record<string, unknown>>>();
  return { value: body.data ? Object.values(body.data)[0] : null, errors: body.errors };
}

async function findUsers(world: ICustomWorld, variables: Record<string, unknown> = {}) {
  const response = await sendGraphQL(world, findUsersQuery, variables);
  const body = response.json<GraphQLResponse<FindUsersData>>();
  assert.strictEqual(body.errors, undefined);
  return body.data!.findUsers;
}

// Table values are strings: pagination arguments become numbers, and "null" an explicit null
function toFindUsersVariables(table: DataTable) {
  return Object.fromEntries(
    Object.entries(table.rowsHash()).map(([key, value]) => {
      if (value === 'null') return [key, null];
      return [key, key === 'limit' || key === 'page' ? Number(value) : value];
    }),
  );
}

Given('these users exist', async function (this: ICustomWorld, table: DataTable) {
  for (const input of table.hashes()) {
    const response = await sendGraphQL(this, createUserMutation, { input });
    assert.strictEqual(response.json<GraphQLResponse<unknown>>().errors, undefined);
  }
});

When('I send a GraphQL mutation to create a user', async function (this: ICustomWorld) {
  this.context.latestResponse = await sendGraphQL(this, createUserMutation, {
    input: this.context.createUserDto,
  });
});

When('I send a GraphQL mutation to delete my user', async function (this: ICustomWorld) {
  const { value: id } = fieldOf(this);
  this.context.latestResponse = await sendGraphQL(this, deleteUserMutation, { id });
});

When(
  'I send a GraphQL mutation to delete the user {string}',
  async function (this: ICustomWorld, id: string) {
    this.context.latestResponse = await sendGraphQL(this, deleteUserMutation, { id });
  },
);

When('I query the users via GraphQL', async function (this: ICustomWorld) {
  this.context.users = await findUsers(this);
});

When('I query the users via GraphQL with', async function (this: ICustomWorld, table: DataTable) {
  this.context.users = await findUsers(this, toFindUsersVariables(table));
});

When(
  'I send a GraphQL query for users with',
  async function (this: ICustomWorld, table: DataTable) {
    this.context.latestResponse = await sendGraphQL(
      this,
      findUsersQuery,
      toFindUsersVariables(table),
    );
  },
);

Then('I receive my user ID from GraphQL', function (this: ICustomWorld) {
  const { value, errors } = fieldOf(this);
  assert.strictEqual(errors, undefined);
  assert.strictEqual(typeof value, 'string');
});

Then('I can see my user in the GraphQL list of users', async function (this: ICustomWorld) {
  const { value: id } = fieldOf(this);
  const users = await findUsers(this);
  assert.strictEqual(
    users.data.some((user) => user.id === id),
    true,
  );
});

Then('GraphQL confirms the deletion', function (this: ICustomWorld) {
  const { value, errors } = fieldOf(this);
  assert.strictEqual(errors, undefined);
  assert.strictEqual(value, true);
});

Then('the GraphQL list of users is empty', async function (this: ICustomWorld) {
  const users = await findUsers(this);
  assert.strictEqual(users.count, 0);
});

Then('I receive a GraphQL error with code {string}', function (this: ICustomWorld, code: string) {
  const { value, errors } = fieldOf(this);
  assert.strictEqual(value ?? null, null);
  assert.strictEqual(errors?.[0]?.extensions?.code, code);
});

Then('I receive a GraphQL validation error', function (this: ICustomWorld) {
  const response = this.context.latestResponse!;
  const body = response.json<GraphQLResponse<unknown>>();
  assert.strictEqual(response.statusCode, 400);
  assert.strictEqual(body.data ?? null, null);
  assert.ok(body.errors?.length);
});

Then('I receive {int} of {int} users', function (this: ICustomWorld, size: number, count: number) {
  const users = this.context.users as FindUsersData['findUsers'];
  assert.strictEqual(users.data.length, size);
  assert.strictEqual(users.count, count);
});

Then('every user is from {string}', function (this: ICustomWorld, country: string) {
  const users = this.context.users as FindUsersData['findUsers'];
  assert.ok(users.data.every((user) => user.country === country));
});

Then('every user has ISO creation and update dates', function (this: ICustomWorld) {
  const users = this.context.users as FindUsersData['findUsers'];
  for (const { createdAt, updatedAt } of users.data) {
    assert.strictEqual(new Date(createdAt).toISOString(), createdAt);
    assert.strictEqual(new Date(updatedAt).toISOString(), updatedAt);
  }
});
