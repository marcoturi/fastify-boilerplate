import { type IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import type * as messages from '@cucumber/messages';
import type { FastifyInstance } from 'fastify';
import type postgres from 'postgres';

export interface ICustomWorld extends World {
  debug: boolean;
  feature?: messages.Pickle;
  testName?: string;
  startTime?: Date;
  db: ReturnType<typeof postgres>;
  server: FastifyInstance;
  context?: any;
}

export class CustomWorld extends World implements ICustomWorld {
  // biome-ignore lint/complexity/noUselessConstructor: needed
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  server = undefined as any;
  db = undefined as any;
}

setWorldConstructor(CustomWorld);
