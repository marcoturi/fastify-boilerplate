import path from 'node:path';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, Lifetime } from 'awilix';
import type { FastifyInstance } from 'fastify';
import { globalDependencies } from '#src/modules/index.ts';
import { uniqueNameFormatter } from '#src/server/di/util.ts';

export async function di(fastify: FastifyInstance) {
  const dependencies = globalDependencies(fastify);
  diContainer.register(dependencies);

  await diContainer.loadModules(
    [
      path.join(import.meta.dirname, '../../modules/**/*.{repository,mapper,service,domain}.ts'),
      [
        path.join(import.meta.dirname, '../../modules/**/*.{handler,event-handler}.ts'),
        { asyncInit: 'init' },
      ],
    ],
    {
      formatName: uniqueNameFormatter(Object.keys(dependencies)),
      esModules: true,
      resolverOptions: {
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  // Expose the container on the instance: on ready the plugin runs the handlers' init(), on
  // close it disposes the container
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
  });
}
