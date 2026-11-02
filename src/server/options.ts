import { requestContext } from '@fastify/request-context';
import type { FastifyServerOptions } from 'fastify';
import { env } from '#src/config/index.ts';
import { requestId } from '#src/server/request-id.ts';
import { getRequestId } from '#src/shared/app/app-request-context.ts';

/** Options of the Fastify instance, shared by the server (src/index.ts) and the e2e tests
 *  (tests/support/server.ts), so the tests run the same request ids, validation and logging. */
export const serverOptions = {
  logger: {
    level: env.log.level,
    // pino's request serializer logs no headers today: these paths keep credentials out of
    // the logs if a custom serializer ever adds them
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    // Attach the request correlation id (from the request-context ALS) to every log line,
    // including those from handlers/repositories. Fastify logs "incoming request" before the
    // context exists: that line takes the id bound to the request's logger. Outside a request,
    // getRequestId() gives a sentinel
    mixin(_object, _level, logger) {
      return {
        correlationId: requestContext.get('requestId') ?? logger.bindings().reqId ?? getRequestId(),
      };
    },
  },
  genReqId: requestId,
  routerOptions: {
    ignoreDuplicateSlashes: true,
  },
  ajv: {
    customOptions: {
      keywords: ['example'],
    },
  },
} satisfies FastifyServerOptions;
