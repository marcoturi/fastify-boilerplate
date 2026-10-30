import type { FastifyInstance } from 'fastify';
import { getDb } from '#src/shared/db/postgres.ts';
import { withTimeout } from '#src/shared/utils/with-timeout.ts';

// How long the database may take to answer the readiness ping
const DB_PING_TIMEOUT_MS = 2000;

/**
 * Readiness probe. `/health` (under-pressure) is the liveness probe: it only says the process
 * is up, because restarting the app never fixes an unreachable database. `/ready` also checks
 * that the database answers, so an orchestrator stops routing traffic here until it does.
 */
async function readinessPlugin(fastify: FastifyInstance) {
  fastify.get('/ready', { logLevel: 'silent', schema: { hide: true } }, async (_req, res) => {
    try {
      await withTimeout(
        getDb()`SELECT 1`,
        DB_PING_TIMEOUT_MS,
        `Database did not answer within ${DB_PING_TIMEOUT_MS} ms`,
      );
      return res.send({ status: 'ok' });
    } catch (error) {
      fastify.log.warn({ err: error }, 'Readiness check failed: the database is unreachable');
      return res.status(503).send({ status: 'unavailable' });
    }
  });
}

export default readinessPlugin;
