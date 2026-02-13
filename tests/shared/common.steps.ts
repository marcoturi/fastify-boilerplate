import assert from 'node:assert';
import { Then } from '@cucumber/cucumber';
import type { ICustomWorld } from '../support/custom-world.ts';

Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (this: ICustomWorld, errorMessage: string, statusCode: string) {
    assert.strictEqual(this.context.latestResponse!.statusCode, +statusCode);
    assert.strictEqual(this.context.latestResponse!.statusMessage, errorMessage);
  },
);
