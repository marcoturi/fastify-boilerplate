import {
  fastifyRequestContext,
  requestContext,
} from '@fastify/request-context';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

async function requestContextPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyRequestContext);
  fastify.addHook('onRequest', async (req) => {
    requestContext.set('requestId', req.id);
  });
}

export default fp(requestContextPlugin, {
  name: 'requestContext',
});
