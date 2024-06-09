import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import * as messages from '@cucumber/messages';
import { FastifyInstance } from 'fastify';
import postgres from 'postgres';

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
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(options: IWorldOptions) {
    super(options);
  }

  debug = false;
  server = undefined as any;
  db = undefined as any;
}

setWorldConstructor(CustomWorld);
