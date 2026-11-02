import { After, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { getDb } from '#src/shared/db/postgres.ts';
import type { CustomWorld } from './custom-world.ts';
import { buildApp } from './server.ts';

setDefaultTimeout(60 * 1000);

Before(async function (this: CustomWorld) {
  this.db = getDb();
  // Start every scenario from an empty table, even after a run that stopped halfway
  await this.db`TRUNCATE TABLE users CASCADE`;
  this.server = await buildApp();
});

After(async function (this: CustomWorld) {
  // The server is missing when buildApp() failed in Before: let that error surface instead.
  // Let the event handlers finish first, or their queries would hit the next scenario's
  // TRUNCATE (src/index.ts does the same on shutdown)
  await this.server?.eventBus.drain();
  await this.server?.close();
});
