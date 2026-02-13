import { After, Before, type ITestCaseHookParameter, setDefaultTimeout } from '@cucumber/cucumber';
import { getDb } from '#src/shared/db/postgres.ts';
import type { ICustomWorld } from './custom-world.ts';
import { buildApp } from './server.ts';

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

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
  this.server = await buildApp();
});

After(async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  if (result) {
    this.attach(`Status: ${result.status}. Duration:${result.duration.seconds}s`);
  }
  await this.server.close();
});
