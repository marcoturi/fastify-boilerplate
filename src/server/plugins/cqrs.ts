import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCqrs from '#src/shared/cqrs/index.ts';

async function cqrsPlugin(fastify: FastifyInstance) {
  await fastify.register(fastifyCqrs);
}

export default fp(cqrsPlugin, {
  name: 'CQRSPlugin',
});
