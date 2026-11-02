import { asValue } from 'awilix';
import type { FastifyBaseLogger, FastifyInstance } from 'fastify';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { type Db, setQueryLogger, transactionAwareDb } from '#src/shared/db/postgres.ts';
import { sqlRepositoryBase } from '#src/shared/db/sql-repository.base.ts';

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: Db;
    repositoryBase: ReturnType<typeof sqlRepositoryBase>;
    queryBus: QueryBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

/** The dependencies every module gets, taken from the Fastify instance (logger, buses) */
export function globalDependencies({
  log: logger,
  queryBus,
  commandBus,
  eventBus,
}: FastifyInstance) {
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
