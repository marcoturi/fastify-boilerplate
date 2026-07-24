import Swagger from '@fastify/swagger';
import SwaggerUI from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { apiErrorResponseRef } from '#src/shared/api/api-error.response.ts';

async function swaggerGeneratorPlugin(fastify: FastifyInstance) {
  await fastify.register(Swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'fastify-boilerplate',
        description: 'The Swagger API documentation for the fastify-boilerplate project.',
        version: process.env.npm_package_version ?? '0.0.0',
      },
    },
    // Document the shared error envelope once, globally, as the `4XX`/`5XX` range
    // responses for every schema-bearing route (also flows into the generated client
    // types). Ranges say "any client/server error looks like this" — clearer than the
    // catch-all `default`, which also implies undeclared success codes. This runs at
    // doc-build time only — it does NOT touch runtime serialization, so success
    // responses stay intact. Routes may still declare a specific code (409, 404) that
    // overrides the range for that status; those are preserved (spread last).
    transform: ({ schema, url }) => ({
      url,
      schema: {
        ...schema,
        response: {
          '4xx': apiErrorResponseRef,
          '5xx': apiErrorResponseRef,
          ...(schema?.response as Record<string | number, unknown> | undefined),
        },
      },
    }),
    // If you don't need to generate client types you could keep swagger
    // swagger: {
    //   info: {
    //     title: 'fastify-boilerplate',
    //     description:
    //       'The Swagger API documentation for the fastify-boilerplate project.',
    //     version: '0.1.0',
    //   },
    //   schemes: ['http', 'https'],
    //   consumes: ['application/json'],
    //   produces: ['application/json'],
    // },
  });

  await fastify.register(SwaggerUI, {
    routePrefix: '/api-docs',
  });

  fastify.log.info(`Swagger documentation is available at /api-docs`);
}

export default fp(swaggerGeneratorPlugin, {
  name: 'swaggerGenerator',
});
