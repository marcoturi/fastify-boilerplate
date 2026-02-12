import { type IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import type * as messages from '@cucumber/messages';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import type postgres from 'postgres';

export interface TestContext {
  createUserDto?: Record<string, string>;
  latestResponse?: LightMyRequestResponse;
  [key: string]: unknown;
}

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  testName?: string;
  startTime?: Date;
  db: ReturnType<typeof postgres>;
  server: FastifyInstance;
  context: TestContext;
}

export class CustomWorld extends World implements ICustomWorld {
  // biome-ignore lint/complexity/noUselessConstructor: needed
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  server = undefined as unknown as FastifyInstance;
  db = undefined as unknown as ReturnType<typeof postgres>;
  context: TestContext = {};
}

setWorldConstructor(CustomWorld);
