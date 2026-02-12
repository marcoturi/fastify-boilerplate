import env from '#src/config/env.ts';
import { di } from '#src/server/di/index.ts';
import getGQL from '#src/server/plugins/gql.ts';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import UnderPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import path from 'node:path';

export default async function createServer(fastify: FastifyInstance) {
  // Graphql
  await fastify.register(mercurius, {
    schema: await getGQL(),
    graphiql: env.isDevelopment,
    defineMutation: true,
  });

  // Set sensible default security headers
  await fastify.register(Helmet, {
    global: true,
    // The following settings are needed for graphiql, see https://github.com/graphql/graphql-playground/issues/1283
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  await fastify.register(Cors, {
    origin: false,
  });

  // Auto-load plugins
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    dirNameRoutePrefix: false,
  });

  // Configure Dependency Injection
  await di(fastify);

  // Auto-load routes
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    dirNameRoutePrefix: false,
    options: {
      autoPrefix: 'api',
    },
    matchFilter: (path) => /\.(route|resolver)\.ts$/.test(path),
  });

  await fastify.register(UnderPressure);

  return fastify.withTypeProvider<TypeBoxTypeProvider>();
}
