import assert from 'node:assert';
import { Then } from '@cucumber/cucumber';
import type { ApiErrorResponse } from '#src/shared/api/api-error.response.ts';
import type { CustomWorld } from '#tests/support/custom-world.ts';

Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (this: CustomWorld, error: string, statusCode: string) {
    const response = this.response;
    assert.strictEqual(response.statusCode, +statusCode);
    const body = response.json<ApiErrorResponse>();
    assert.strictEqual(body.statusCode, +statusCode);
    assert.strictEqual(body.error, error);
    assert.ok(body.correlationId);
  },
);

Then('the error reason is {string}', function (this: CustomWorld, reason: string) {
  assert.strictEqual(this.response.json<ApiErrorResponse>().reason, reason);
});

Then('the error points to {string}', function (this: CustomWorld, path: string) {
  const { subErrors } = this.response.json<ApiErrorResponse>();
  assert.strictEqual(subErrors?.[0]?.path, path);
});
