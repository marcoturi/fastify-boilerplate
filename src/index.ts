import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import { env } from '#src/config/index.ts';
import { shutdownTelemetry } from '#src/instrumentation.ts';
import server from '#src/server/index.ts';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import { closeDbConnection } from '#src/shared/db/postgres.ts';

// How long a graceful shutdown may take before the process exits anyway
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function init() {
  const fastify = Fastify({
    logger: {
      level: env.log.level,
      // pino's request serializer logs no headers today: these paths keep credentials out of
      // the logs if a custom serializer ever adds them
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      // Attach the request correlation id (from the request-context ALS) to every log line,
      // including those from handlers/repositories. Falls back to a sentinel outside a request.
      mixin() {
        return { correlationId: getRequestId() };
      },
    },
    genReqId: (req) => {
      // header best practice: don't use "x-" https://www.rfc-editor.org/info/rfc6648 and keep it lowercase
      return (req.headers['request-id'] as string) ?? randomUUID();
    },
    routerOptions: {
      ignoreDuplicateSlashes: true,
    },
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  await server(fastify);

  // Graceful shutdown: close DB connection when the server shuts down
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing database connection…');
    await closeDbConnection();
  });

  // Graceful shutdown: close the server (and the DB, via onClose), then flush telemetry.
  // A second signal, or a close that hangs, exits at once instead of waiting forever.
  let shuttingDown = false;
  const shutDown = async (reason: string, exitCode = 0) => {
    if (shuttingDown) {
      fastify.log.warn(`${reason} received while shutting down, exiting now`);
      process.exit(1);
    }
    shuttingDown = true;
    fastify.log.info(`${reason}, shutting down gracefully…`);
    setTimeout(() => {
      fastify.log.error('Graceful shutdown timed out, exiting');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();

    let code = exitCode;
    try {
      await fastify.close();
    } catch (error) {
      fastify.log.error(error, 'Error while closing the server');
      code = 1;
    }
    try {
      await shutdownTelemetry(); // flush buffered spans/metrics before exit
    } catch (error) {
      fastify.log.error(error, 'Error while flushing telemetry');
      code = 1;
    }
    process.exit(code);
  };
  process.on('SIGTERM', () => shutDown('SIGTERM'));
  process.on('SIGINT', () => shutDown('SIGINT'));

  try {
    await fastify.listen({ port: env.server.port, host: env.server.host });
    fastify.log.info('Server is ready');
  } catch (error) {
    fastify.log.error(error);
    await shutDown('Startup failed', 1);
  }
}

await init();
