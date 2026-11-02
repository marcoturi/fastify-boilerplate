import Fastify from 'fastify';
import { env } from '#src/config/index.ts';
import { shutdownTelemetry } from '#src/instrumentation.ts';
import server from '#src/server/index.ts';
import { serverOptions } from '#src/server/options.ts';
import { closeDbConnection } from '#src/shared/db/postgres.ts';

// How long a graceful shutdown may take before the process exits anyway
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function init() {
  const fastify = Fastify(serverOptions);

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

    // close() waits for the requests in flight but drops only the connections idle when it
    // starts: a keep-alive connection that answers one of them would then hold it open
    setInterval(() => fastify.server.closeIdleConnections(), 100).unref();

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

  // Inside the try, so a plugin that fails to load is logged and shuts the server down too
  try {
    await server(fastify);

    // Graceful shutdown: once the HTTP requests are done, let the event handlers they started
    // finish their queries, then close the DB connection
    fastify.addHook('onClose', async (instance) => {
      await instance.eventBus.drain();
      instance.log.info('Closing database connection…');
      await closeDbConnection();
    });

    await fastify.listen({ port: env.server.port, host: env.server.host });
    fastify.log.info('Server is ready');
  } catch (error) {
    fastify.log.error(error);
    await shutDown('Startup failed', 1);
  }
}

await init();
