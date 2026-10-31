import { asValue } from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import type postgres from 'postgres';
import type { CommandBus, EventBus, QueryBus } from '#src/shared/cqrs/bus.types.ts';
import type { AsyncMethods } from '#src/shared/db/database-errors.ts';
import { setQueryLogger, transactionAwareDb } from '#src/shared/db/postgres.ts';
import {
  type CustomMethods,
  type RepositoryBase,
  type SqlRepositoryBaseProps,
  sqlRepositoryBase,
} from '#src/shared/db/sql-repository.base.ts';

type SqlBaseProps<E = { id: string }, D = Record<string, unknown>> = Omit<
  SqlRepositoryBaseProps<E, D>,
  'logger' | 'db'
>;

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: ReturnType<typeof postgres>;
    repositoryBase: <
      E extends { id: string },
      D extends Record<string, unknown>,
      C extends AsyncMethods = Record<never, never>,
    >(
      props: SqlBaseProps<E, D>,
      custom?: CustomMethods<C>,
    ) => RepositoryBase<E, C>;
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
  const repositoryBaseFn = <
    E extends { id: string },
    D extends Record<string, unknown>,
    C extends AsyncMethods = Record<never, never>,
  >(
    { tableName, mapper }: SqlBaseProps<E, D>,
    custom?: CustomMethods<C>,
  ) => sqlRepositoryBase<E, D, C>({ logger, db, tableName, mapper }, custom);
  return {
    logger: asValue(logger),
    db: asValue(db),
    repositoryBase: asValue(repositoryBaseFn),
    queryBus: asValue(queryBus),
    commandBus: asValue(commandBus),
    eventBus: asValue(eventBus),
  };
}
