import server from '../../src/server';
import Fastify from 'fastify';

export const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: 'warn',
    },
    disableRequestLogging: true,
    ignoreDuplicateSlashes: true,
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  await server(app);
  return app;
};
