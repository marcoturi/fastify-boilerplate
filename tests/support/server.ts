import server from '../../src/server/index.ts';
import Fastify from 'fastify';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: 'warn',
    },
    disableRequestLogging: true,
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
