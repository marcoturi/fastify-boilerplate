import { ICustomWorld } from '../support/custom-world';
import { Then } from '@cucumber/cucumber';
import assert from 'node:assert';

Then(
  /^I receive an error "(.*)" with status code (\d+)$/,
  async function (
    this: ICustomWorld,
    errorMessage: string,
    statusCode: string,
  ) {
    assert.strictEqual(this.context.latestResponse.statusCode, +statusCode);
    assert.strictEqual(this.context.latestResponse.statusMessage, errorMessage);
  },
);
