import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { commandBus } from '#src/shared/cqrs/command-bus.ts';
import { eventBus } from '#src/shared/cqrs/event-bus.ts';
import { decorateWithMetadata, makeTrackExecutionTime } from '#src/shared/cqrs/middlewares.ts';
import fastifyPlugin from 'fastify-plugin';

const CQRSPlugin = fastifyPlugin(
  (fastify, _opts, done) => {
    if (fastify.queryBus || fastify.commandBus || fastify.eventBus) {
      throw new Error('This plugin is already registered');
    }
    const eventBusInstance = eventBus();
    eventBusInstance.addMiddleware(decorateWithMetadata);

    // QueryBus uses the same underlying implementation as CommandBus
    // but is semantically distinct (queries must be idempotent / side-effect-free)
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
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export default CQRSPlugin;
