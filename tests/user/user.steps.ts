import assert from 'node:assert';
import { Before, Given, Then, When } from '@cucumber/cucumber';
import type { UserModel } from '#src/modules/user/database/user.repository.ts';
import type { Paginated } from '#src/shared/db/repository.port.ts';
import type { ICustomWorld } from '../support/custom-world.ts';

Before({ tags: '@user' }, async function (this: ICustomWorld) {
  await this.db`TRUNCATE "users"`;
});

Given(/^user profile data$/, function (this: ICustomWorld, table) {
  this.context.createUserDto = table.hashes()[0];
});

When('I send a request to create a user', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({
    method: 'POST',
    url: '/api/v1/users',
    body: this.context.createUserDto,
  });
});

Then('I receive my user ID', function (this: ICustomWorld) {
  assert.deepStrictEqual(typeof this.context.latestResponse!.json().id, 'string');
});

Then('I can see my user in a list of all users', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'GET',
    url: '/api/v1/users',
  });
  const users = response.json<Paginated<UserModel>>();
  assert.strictEqual(
    users.data.some((item) => item.id === this.context.latestResponse!.json().id),
    true,
  );
});

Then('I send a request to delete my user', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'DELETE',
    url: `/api/v1/users/${this.context.latestResponse!.json().id}`,
  });
  assert.strictEqual(response.statusCode, 204);
});

When('I request the users with {string}', async function (this: ICustomWorld, query: string) {
  this.context.latestResponse = await this.server.inject({
    method: 'GET',
    url: `/api/v1/users?${query}`,
  });
});

When(
  'I page through the users {int} at a time',
  async function (this: ICustomWorld, limit: number) {
    const fetchPage = async (page: number) => {
      const response = await this.server.inject({
        method: 'GET',
        url: `/api/v1/users?limit=${limit}&page=${page}`,
      });
      return response.json<Paginated<UserModel>>();
    };
    const first = await fetchPage(0);
    const users = [...first.data];
    for (let page = 1; page * limit < first.count; page++) {
      users.push(...(await fetchPage(page)).data);
    }
    this.context.pagedUsers = users;
    this.context.userCount = first.count;
  },
);

Then('I see every user exactly once, newest first', function (this: ICustomWorld) {
  const users = this.context.pagedUsers as UserModel[];
  assert.strictEqual(users.length, this.context.userCount);
  assert.strictEqual(new Set(users.map((user) => user.id)).size, users.length);
  const createdAt = users.map((user) => Date.parse(user.createdAt));
  assert.ok(createdAt.every((time, i) => i === 0 || time <= createdAt[i - 1]!));
});

Then('I cannot see my user in a list of all users', async function (this: ICustomWorld) {
  const response = await this.server.inject({
    method: 'GET',
    url: '/api/v1/users',
  });
  const users = response.json<Paginated<UserModel>>();
  assert.strictEqual(
    users.data.some((item) => item.id === this.context.latestResponse!.json().id),
    false,
  );
});
