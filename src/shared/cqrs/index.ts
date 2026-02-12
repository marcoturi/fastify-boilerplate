import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { commandBus } from '#src/shared/cqrs/command-bus.ts';
import { eventBus } from '#src/shared/cqrs/event-bus.ts';
import {
  decorateCommandWithMetadata,
  decorateEventWithMetadata,
  makeTrackExecutionTime,
} from '#src/shared/cqrs/middlewares.ts';
import { queryBus } from '#src/shared/cqrs/query-bus.ts';
import fastifyPlugin from 'fastify-plugin';

const CQRSPlugin = fastifyPlugin(
  (fastify, _opts, done) => {
    if (fastify.queryBus || fastify.commandBus || fastify.eventBus) {
      throw new Error('This plugin is already registered');
    }

    const eventBusInstance = eventBus({ logger: fastify.log });
    eventBusInstance.addMiddleware(decorateEventWithMetadata);

    const queryBusInstance = queryBus();
    queryBusInstance.addMiddleware(decorateCommandWithMetadata);
    queryBusInstance.addMiddleware(makeTrackExecutionTime(fastify.log));

    const commandBusInstance = commandBus();
    commandBusInstance.addMiddleware(decorateCommandWithMetadata);
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
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export default CQRSPlugin;
