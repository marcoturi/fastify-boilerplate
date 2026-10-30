import assert from 'node:assert';
import { Then } from '@cucumber/cucumber';
import type { ApiErrorResponse } from '#src/shared/api/api-error.response.ts';
import type { ICustomWorld } from '../support/custom-world.ts';

Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (this: ICustomWorld, error: string, statusCode: string) {
    const response = this.context.latestResponse!;
    assert.strictEqual(response.statusCode, +statusCode);
    // The body follows the shared error envelope (src/shared/api/api-error.response.ts)
    const body = response.json<ApiErrorResponse>();
    assert.strictEqual(body.statusCode, +statusCode);
    assert.strictEqual(body.error, error);
    assert.ok(body.correlationId);
  },
);
