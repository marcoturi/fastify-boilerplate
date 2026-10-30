import assert from 'node:assert';
import { Then, When } from '@cucumber/cucumber';
import { withTransaction } from '#src/shared/db/postgres.ts';
import type { ICustomWorld } from '../support/custom-world.ts';

const newUser = {
  email: 'tx@example.com',
  country: 'Italy',
  postalCode: '10100',
  street: 'Via Roma',
};

/** Inserts a user through the repository from DI, as a handler would, inside a transaction. */
const insertUser = async (world: ICustomWorld) => {
  const { userDomain, userRepository } = world.server.diContainer.cradle;
  await userRepository.insert(userDomain.createUser(newUser).entity);
};

When('I create a user inside a transaction that fails', async function (this: ICustomWorld) {
  await assert.rejects(
    withTransaction(async () => {
      await insertUser(this);
      throw new Error('rollback');
    }),
    /rollback/,
  );
});

When('I create a user inside a transaction that succeeds', async function (this: ICustomWorld) {
  await withTransaction(() => insertUser(this));
});

Then('there are {int} users in the database', async function (this: ICustomWorld, count: number) {
  const [row] = await this.db`SELECT COUNT(*)::int AS count FROM users`;
  assert.strictEqual(row?.count, count);
});
