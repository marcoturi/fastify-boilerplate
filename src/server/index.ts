import path from 'node:path';
import AutoLoad from '@fastify/autoload';
import Cors from '@fastify/cors';
import Helmet from '@fastify/helmet';
import UnderPressure from '@fastify/under-pressure';
import type { FastifyInstance } from 'fastify';
import { enableDevMode, Location } from 'graphql';
import mercurius from 'mercurius';
import { env } from '#src/config/index.ts';
import { di } from '#src/server/di/index.ts';
import { graphqlErrorFormatter } from '#src/server/graphql-error-formatter.ts';
import { loadGraphqlSchema } from '#src/server/graphql-schema.ts';

export default async function server(fastify: FastifyInstance) {
  // Set sensible default security headers.
  await fastify.register(Helmet, {
    // Off in development for graphiql, see https://github.com/graphql/graphql-playground/issues/1283
    contentSecurityPolicy: !env.isDevelopment,
    // Not a Helmet default: this turns COEP (require-corp) on outside development
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

  await fastify.register(mercurius, {
    schema: await loadGraphqlSchema(),
    graphiql: env.isDevelopment,
    errorFormatter: graphqlErrorFormatter,
    // Caps the size of a query: otherwise one request could repeat under thousands
    // of aliases, each a paginated query. Introspection stays well below it
    graphql: { parseOptions: { maxTokens: 1000 } },
    // The query caches are keyed by the whole text, comments included (they are not tokens):
    // a client could fill them with ~1 MB queries. Parsing 1000 tokens costs little
    cache: false,
  });
  // A query that is not valid GraphQL text is retried as a JSON AST, which skips maxTokens:
  // accept only documents parsed from text (only parse() sets a Location)
  fastify.graphql.addHook('preValidation', async (_schema, document) => {
    if (!(document?.loc instanceof Location)) {
      throw new mercurius.ErrorWithProps('Syntax Error: the query must be GraphQL text', {}, 400);
    }
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

  // Load shedding: while the event loop is saturated, requests get a 503 with Retry-After
  // instead of queueing up past any useful timeout. /health is exempt (a no-op
  // pressureHandler lets it through): an overloaded process is alive, and restarting it
  // would not help.
  await fastify.register(UnderPressure, {
    maxEventLoopDelay: 1000,
    maxEventLoopUtilization: 0.98,
    exposeStatusRoute: {
      routeOpts: { logLevel: 'silent', config: { pressureHandler: () => undefined } },
      url: '/health',
    },
  });
}
