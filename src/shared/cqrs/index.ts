import type { CommandBus, EventBus } from '@/shared/cqrs/bus.types';
import { commandBus } from '@/shared/cqrs/command-bus';
import { eventBus } from '@/shared/cqrs/event-bus';
import {
  decorateWithMetadata,
  makeTrackExecutionTime,
} from '@/shared/cqrs/middlewares';
import fastifyPlugin from 'fastify-plugin';

const CQRSPlugin = fastifyPlugin(
  (fastify, _opts, done) => {
    if (fastify.queryBus || fastify.commandBus || fastify.eventBus) {
      throw new Error('This plugin is already registered');
    }
    const eventBusInstance = eventBus();
    eventBusInstance.addMiddleware(decorateWithMetadata);

    const queryBusInstance = commandBus();
    queryBusInstance.addMiddleware(makeTrackExecutionTime(fastify.log));

    const commandBusInstance = commandBus();
    commandBusInstance.addMiddleware(makeTrackExecutionTime(fastify.log));

    fastify.decorate('queryBus', queryBusInstance);
    fastify.decorate('commandBus', commandBusInstance);
    fastify.decorate('eventBus', eventBusInstance);
    done();
  },
  {
    name: 'fastify-cqrs',
    fastify: '5.x',
  },
);

declare module 'fastify' {
  interface FastifyInstance {
    queryBus: CommandBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export default CQRSPlugin;
