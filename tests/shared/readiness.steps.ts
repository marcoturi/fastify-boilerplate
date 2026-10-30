import assert from 'node:assert';
import { Then, When } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

When('I check whether the service is ready', async function (this: ICustomWorld) {
  this.context.latestResponse = await this.server.inject({ method: 'GET', url: '/ready' });
});

Then('the service reports that it is ready', function (this: ICustomWorld) {
  const response = this.context.latestResponse!;
  assert.strictEqual(response.statusCode, 200);
  assert.deepStrictEqual(response.json(), { status: 'ok' });
});
