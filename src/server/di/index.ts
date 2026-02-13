import path from 'node:path';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, Lifetime } from 'awilix';
import type { FastifyInstance } from 'fastify';
import { makeDependencies } from '#src/modules/index.ts';
import { formatName } from '#src/server/di/util.ts';

export async function di(fastify: FastifyInstance) {
  diContainer.register({
    ...makeDependencies({
      logger: fastify.log,
      queryBus: fastify.queryBus,
      commandBus: fastify.commandBus,
      eventBus: fastify.eventBus,
    }),
  });

  await diContainer.loadModules(
    [
      path.join(
        import.meta.dirname,
        '../../modules/**/*.{repository,mapper,service,domain}.{js,ts}',
      ),
    ],
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
    [path.join(import.meta.dirname, '../../modules/**/*.{handler,event-handler}.{js,ts}')],
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
