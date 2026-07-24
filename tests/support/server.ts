import Fastify, { LogController } from 'fastify';
import server from '../../src/server/index.ts';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: 'warn',
    },
    logController: new LogController({ disableRequestLogging: true }),
    routerOptions: {
      ignoreDuplicateSlashes: true,
    },
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  await server(app);
  return app;
};
