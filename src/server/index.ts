import path from 'node:path';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import UnderPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import { enableDevMode } from 'graphql';
import mercurius from 'mercurius';
import env from '#src/config/env.ts';
import { di } from '#src/server/di/index.ts';
import { graphqlErrorFormatter } from '#src/server/graphql-error-formatter.ts';
import { loadGraphqlSchema } from '#src/server/graphql-schema.ts';

export default async function createServer(fastify: FastifyInstance) {
  // Set sensible default security headers.
  // Registered before any route (including GraphQL) so its onRequest hook applies globally.
  await fastify.register(Helmet, {
    global: true,
    // The following settings are needed for graphiql, see https://github.com/graphql/graphql-playground/issues/1283
    contentSecurityPolicy: !env.isDevelopment,
    crossOriginEmbedderPolicy: !env.isDevelopment,
  });

  // Enables the use of CORS in a Fastify application.
  // https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
  // `origin: false` disables CORS headers entirely (suitable for same-origin / server-to-server).
  // Set to `true` or a specific origin string/array for cross-origin frontends.
  await fastify.register(Cors, {
    origin: false,
  });

  // graphql >= 17 no longer turns on its development checks from NODE_ENV: enable them
  // everywhere except production, as graphql 16 did. Must run before the schema is built.
  if (!env.isProduction) {
    enableDevMode();
  }

  // Graphql — registered after Helmet/CORS so the /graphql endpoint inherits their hooks.
  await fastify.register(mercurius, {
    schema: await loadGraphqlSchema(),
    graphiql: env.isDevelopment,
    defineMutation: true,
    errorFormatter: graphqlErrorFormatter,
  });

  // Auto-load plugins
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    dirNameRoutePrefix: false,
    // Specs live next to the plugins they test: importing one would run its tests at startup
    ignoreFilter: /\.spec\.ts$/,
  });

  // Configure Dependency Injection
  await di(fastify);

  // Auto-load routes
  await fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, '../modules'),
    dirNameRoutePrefix: false,
    options: {
      prefix: '/api',
    },
    matchFilter: (path) => /\.(route|resolver)\.ts$/.test(path),
    // By default an index.ts makes autoload skip every other file in its folder, so an index
    // next to routes would silently drop them: match no file as index, matchFilter decides alone
    indexPattern: /^$/,
  });

  await fastify.register(UnderPressure, {
    healthCheck: async () => true,
    healthCheckInterval: 5000,
    exposeStatusRoute: {
      routeOpts: { logLevel: 'silent' },
      url: '/health',
    },
  });

  return fastify.withTypeProvider<TypeBoxTypeProvider>();
}
