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
    data: { id: string; country: string }[];
  };
}

const putUserMutation = `
  mutation PutUser($input: PutUserPayload!) {
    putUser(input: $input)
  }
`;

const findUsersQuery = `
  query FindUsers($limit: Int, $page: Int, $country: String, $postalCode: String, $street: String) {
    findUsers(limit: $limit, page: $page, country: $country, postalCode: $postalCode, street: $street) {
      page
      count
      limit
      data { id country }
    }
  }
`;

function sendGraphQL(world: ICustomWorld, query: string, variables: Record<string, unknown> = {}) {
  return world.server.inject({ method: 'POST', url: '/graphql', body: { query, variables } });
}

async function findUsers(world: ICustomWorld, variables: Record<string, unknown> = {}) {
  const response = await sendGraphQL(world, findUsersQuery, variables);
  const body = response.json<GraphQLResponse<FindUsersData>>();
  assert.strictEqual(body.errors, undefined);
  return body.data!.findUsers;
}

Given('these users exist', async function (this: ICustomWorld, table: DataTable) {
  for (const input of table.hashes()) {
    const response = await sendGraphQL(this, putUserMutation, { input });
    assert.strictEqual(response.json<GraphQLResponse<unknown>>().errors, undefined);
  }
});

When('I send a GraphQL mutation to create a user', async function (this: ICustomWorld) {
  this.context.latestResponse = await sendGraphQL(this, putUserMutation, {
    input: this.context.createUserDto,
  });
});

When('I query the users via GraphQL', async function (this: ICustomWorld) {
  this.context.users = await findUsers(this);
});

When('I query the users via GraphQL with', async function (this: ICustomWorld, table: DataTable) {
  const variables = Object.fromEntries(
    Object.entries(table.rowsHash()).map(([key, value]) => [
      key,
      key === 'limit' || key === 'page' ? Number(value) : value,
    ]),
  );
  this.context.users = await findUsers(this, variables);
});

Then('I receive my user ID from GraphQL', function (this: ICustomWorld) {
  const body = this.context.latestResponse!.json<GraphQLResponse<{ putUser: string }>>();
  assert.strictEqual(body.errors, undefined);
  assert.strictEqual(typeof body.data?.putUser, 'string');
});

Then('I can see my user in the GraphQL list of users', async function (this: ICustomWorld) {
  const { putUser } =
    this.context.latestResponse!.json<GraphQLResponse<{ putUser: string }>>().data!;
  const users = await findUsers(this);
  assert.strictEqual(
    users.data.some((user) => user.id === putUser),
    true,
  );
});

Then('I receive a GraphQL error with code {string}', function (this: ICustomWorld, code: string) {
  const body = this.context.latestResponse!.json<GraphQLResponse<{ putUser: string | null }>>();
  assert.strictEqual(body.data?.putUser ?? null, null);
  assert.strictEqual(body.errors?.[0]?.extensions?.code, code);
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
