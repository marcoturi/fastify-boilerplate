import { makeDependencies } from '@/modules';
import { formatName } from '@/server/di/util';
import { diContainer, fastifyAwilixPlugin } from '@fastify/awilix';
import { asFunction, Lifetime } from 'awilix';
import { FastifyInstance } from 'fastify';
import path from 'node:path';

export async function di(fastify: FastifyInstance) {
  diContainer
    .register({
      ...makeDependencies({
        logger: fastify.log,
        queryBus: fastify.queryBus,
        commandBus: fastify.commandBus,
        eventBus: fastify.eventBus,
      }),
    })
    .loadModules(
      [
        path.join(
          __dirname,
          '../../modules/**/*.{repository,mapper,service,domain}.{js,ts}',
        ),
      ],
      {
        formatName,
        resolverOptions: {
          register: asFunction,
          lifetime: Lifetime.SINGLETON,
        },
      },
    )
    .loadModules(
      [
        path.join(
          __dirname,
          '../../modules/**/*.{handler,event-handler}.{js,ts}',
        ),
      ],
      {
        formatName,
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
