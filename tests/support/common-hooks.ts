import { ICustomWorld } from './custom-world';
import { buildApp } from './server';
import { env } from '@/config';
import {
  After,
  Before,
  ITestCaseHookParameter,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import postgres from 'postgres';

setDefaultTimeout(process.env.PWDEBUG ? -1 : 60 * 1000);

Before({ tags: '@pending' }, () => 'skipped' as any);

Before({ tags: '@debug' }, function (this: ICustomWorld) {
  this.debug = true;
});

Before(async function (this: ICustomWorld, { pickle }: ITestCaseHookParameter) {
  this.startTime = new Date();
  this.testName = pickle.name.replaceAll(/\W/g, '-');
  this.feature = pickle;
  this.context = {};
  this.db = postgres(env.db.url);
  this.server = await buildApp();
});

After(async function (this: ICustomWorld, { result }: ITestCaseHookParameter) {
  if (result) {
    this.attach(
      `Status: ${result.status}. Duration:${result.duration.seconds}s`,
    );
  }
  await this.server.close();
  await this.db.end();
});
