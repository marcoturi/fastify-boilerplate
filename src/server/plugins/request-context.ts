import { fastifyRequestContext } from '@fastify/request-context';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function requestContextPlugin(fastify: FastifyInstance) {
  // Every request starts with its id in the context, read by getRequestId()
  await fastify.register(fastifyRequestContext, {
    defaultStoreValues: (req) => ({ requestId: req.id }),
  });
}

export default fp(requestContextPlugin, {
  name: 'requestContext',
});
