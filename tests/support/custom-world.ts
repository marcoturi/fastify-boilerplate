import assert from 'node:assert';
import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import type postgres from 'postgres';

/** State the steps of a scenario share */
export interface TestContext {
  createUserDto?: Record<string, string>;
  latestResponse?: LightMyRequestResponse;
  [key: string]: unknown;
}

export class CustomWorld extends World {
  // Set for every scenario by the Before hook (common-hooks.ts)
  declare server: FastifyInstance;
  declare db: ReturnType<typeof postgres>;
  context: TestContext = {};

  /** The latest response: reading it before any request was sent is a broken scenario */
  get response(): LightMyRequestResponse {
    assert.ok(this.context.latestResponse, 'No response yet: the scenario sent no request');
    return this.context.latestResponse;
  }
}

setWorldConstructor(CustomWorld);
