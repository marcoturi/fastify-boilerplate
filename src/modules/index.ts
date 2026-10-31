import { asValue } from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import type postgres from 'postgres';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { setQueryLogger, transactionAwareDb } from '#src/shared/db/postgres.ts';
import { sqlRepositoryBase } from '#src/shared/db/sql-repository.base.ts';

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: ReturnType<typeof postgres>;
    repositoryBase: ReturnType<typeof sqlRepositoryBase>;
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

export function globalDependencies({
  logger,
  queryBus,
  commandBus,
  eventBus,
}: {
  logger: FastifyBaseLogger;
  queryBus: QueryBus;
  commandBus: CommandBus;
  eventBus: EventBus;
}) {
  setQueryLogger(logger);
  const db = transactionAwareDb();
  return {
    logger: asValue(logger),
    db: asValue(db),
    repositoryBase: asValue(sqlRepositoryBase(db)),
    queryBus: asValue(queryBus),
    commandBus: asValue(commandBus),
    eventBus: asValue(eventBus),
  };
}
