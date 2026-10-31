import Fastify, { LogController } from 'fastify';
import server from '#src/server/index.ts';
import { serverOptions } from '#src/server/options.ts';

export const buildApp = async () => {
  const app = Fastify({
    ...serverOptions,
    // Quieter than the server: warnings and errors only, without a line per request
    logger: { ...serverOptions.logger, level: 'warn' },
    logController: new LogController({ disableRequestLogging: true }),
  });

  await server(app);
  return app;
};
