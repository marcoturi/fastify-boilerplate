import type { CommandBus, EventBus } from '#src/shared/cqrs/bus.types.ts';
import PostgresDB from '#src/shared/db/postgres.ts';
import type { RepositoryPort } from '#src/shared/db/repository.port.ts';
import {
  SqlRepositoryBase,
  type SqlRepositoryBaseProps,
} from '#src/shared/db/sql-repository.base.ts';
import { asValue } from 'awilix';
import type { FastifyBaseLogger } from 'fastify';
import type postgres from 'postgres';

declare global {
  export interface Dependencies {
    logger: FastifyBaseLogger;
    db: ReturnType<typeof postgres>;
    repositoryBase: (props: SqlBaseProps) => RepositoryPort<any>;
    queryBus: CommandBus;
    commandBus: CommandBus;
    eventBus: EventBus;
  }
}

type SqlBaseProps = Omit<SqlRepositoryBaseProps<any, any>, 'logger' | 'db'>;

export function makeDependencies({
  logger,
  queryBus,
  commandBus,
  eventBus,
}: {
  logger: FastifyBaseLogger;
  queryBus: CommandBus;
  commandBus: CommandBus;
  eventBus: EventBus;
}) {
  const repositoryBaseFn = ({ tableName, mapper }: SqlBaseProps) =>
    SqlRepositoryBase({
      logger,
      db: PostgresDB,
      tableName,
      mapper,
    });
  return {
    logger: asValue(logger),
    db: asValue(PostgresDB),
    repositoryBase: asValue(repositoryBaseFn),
    queryBus: asValue(queryBus),
    commandBus: asValue(commandBus),
    eventBus: asValue(eventBus),
  };
}
