import { After, Before, type ITestCaseHookParameter, setDefaultTimeout } from '@cucumber/cucumber';
import { getDb } from '#src/shared/db/postgres.ts';
import type { ICustomWorld } from './custom-world.ts';
import { buildApp } from './server.ts';

setDefaultTimeout(60 * 1000);

Before({ tags: '@pending' }, () => 'skipped' as unknown as undefined);

Before({ tags: '@debug' }, function (this: ICustomWorld) {
  this.debug = true;
});

Before(async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.startTime = new Date();
  this.testName = pickle.name.replaceAll(/\W/g, '-');
  this.feature = pickle;
  this.context = {};
  this.db = getDb();
  // Start every scenario from an empty table, even after a run that stopped halfway
  await this.db`TRUNCATE TABLE users CASCADE`;
  this.server = await buildApp();
});

After(async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  if (result) {
    this.attach(`Status: ${result.status}. Duration:${result.duration.seconds}s`);
  }
  // The server is missing when buildApp() failed in Before: let that error surface instead
  await this.server?.close();
});
