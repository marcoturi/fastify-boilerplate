import assert from 'node:assert';
import { setWorldConstructor, World } from '@cucumber/cucumber';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import type postgres from 'postgres';

/** A user as both transports list it, with the fields the steps check */
interface ListedUser {
  id: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

/** State the steps of a scenario share */
export interface TestContext {
  createUserDto?: Record<string, string>;
  latestResponse?: LightMyRequestResponse;
  /** The latest page of users, from either transport */
  users?: { data: ListedUser[]; count: number };
  /** Every user read page by page, and the total the first page reported */
  pagedUsers?: ListedUser[];
  userCount?: number;
}

export class CustomWorld extends World {
  // Set for every scenario by the Before hook (common-hooks.ts)
  declare server: FastifyInstance;
  declare db: postgres.Sql;
  context: TestContext = {};

  /** The latest response: reading it before any request was sent is a broken scenario */
  get response(): LightMyRequestResponse {
    assert.ok(this.context.latestResponse, 'No response yet: the scenario sent no request');
    return this.context.latestResponse;
  }
}

setWorldConstructor(CustomWorld);
