import fastifyPlugin from 'fastify-plugin';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { eventBus } from '#src/shared/cqrs/event-bus.ts';
import {
  decorateCommandWithMetadata,
  trackExecutionTimeMiddleware,
} from '#src/shared/cqrs/middlewares.ts';
import { tracingMiddleware } from '#src/shared/cqrs/otel-middleware.ts';
import { requestBus } from '#src/shared/cqrs/request-bus.ts';

const CQRSPlugin = fastifyPlugin(
  (fastify, _opts, done) => {
    // Middleware order (first added = outermost wrapper):
    //   metadata → tracing → trackExecutionTime → handler
    // The event bus stamps the metadata itself, once per emitted event

    const eventBusInstance = eventBus({ logger: fastify.log });
    eventBusInstance.addMiddleware(tracingMiddleware('event'));

    const queryBusInstance = requestBus('Query');
    queryBusInstance.addMiddleware(decorateCommandWithMetadata);
    queryBusInstance.addMiddleware(tracingMiddleware('query'));
    queryBusInstance.addMiddleware(trackExecutionTimeMiddleware(fastify.log));

    const commandBusInstance = requestBus('Command');
    commandBusInstance.addMiddleware(decorateCommandWithMetadata);
    commandBusInstance.addMiddleware(tracingMiddleware('command'));
    commandBusInstance.addMiddleware(trackExecutionTimeMiddleware(fastify.log));

    // decorate() throws if a bus is already there, e.g. when the plugin is registered twice
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
