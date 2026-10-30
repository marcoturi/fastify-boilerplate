import path from 'node:path';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, Lifetime } from 'awilix';
import type { FastifyInstance } from 'fastify';
import { globalDependencies } from '#src/modules/index.ts';
import { uniqueNameFormatter } from '#src/server/di/util.ts';

export async function di(fastify: FastifyInstance) {
  const dependencies = globalDependencies({
    logger: fastify.log,
    queryBus: fastify.queryBus,
    commandBus: fastify.commandBus,
    eventBus: fastify.eventBus,
  });
  diContainer.register(dependencies);

  // Shared by both loads, so a name clash is caught across them and with the global dependencies
  const formatName = uniqueNameFormatter(Object.keys(dependencies));

  await diContainer.loadModules(
    [path.join(import.meta.dirname, '../../modules/**/*.{repository,mapper,service,domain}.ts')],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  await diContainer.loadModules(
    [path.join(import.meta.dirname, '../../modules/**/*.{handler,event-handler}.ts')],
    {
      formatName,
      esModules: true,
      resolverOptions: {
        asyncInit: 'init',
        register: asFunction,
        lifetime: Lifetime.SINGLETON,
      },
    },
  );

  // Create a dependency injection container
  await fastify.register(fastifyAwilixPlugin, {
    container: diContainer,
    asyncInit: true,
  });
}
