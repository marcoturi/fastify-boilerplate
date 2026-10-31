import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import { type AsyncMethods, mapDatabaseErrors } from '#src/shared/db/database-errors.ts';
import type {
  OrderBy,
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';
import { type Condition, orderByClause, whereClause } from '#src/shared/db/sql-fragments.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export interface SqlRepositoryBaseProps<Entity, DbModel> {
  db: Dependencies['db'];
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
  logger: FastifyBaseLogger;
}

/** SQL helpers bound to the repository's client, for its custom queries */
export interface QueryHelpers {
  /** WHERE clause joining the set conditions with AND: empty when none is set */
  where(conditions: Condition[]): ReturnType<typeof whereClause>;
  /** Deterministic ORDER BY on the field, with `id` as a tiebreaker */
  orderBy(order: OrderBy): ReturnType<typeof orderByClause>;
}

/** Builds a repository's custom methods from the query helpers */
export type CustomMethods<Custom extends AsyncMethods> = (helpers: QueryHelpers) => Custom;

/** The generic CRUD of a repository plus its custom methods */
export type RepositoryBase<
  Entity,
  Custom extends AsyncMethods = Record<never, never>,
> = RepositoryPort<Entity> & Custom;

/**
 * Builds a repository: the generic CRUD, plus the custom methods `custom` returns from the
 * query helpers. Every method maps driver errors to domain exceptions (see mapDatabaseErrors),
 * custom ones included, so a repository never wraps them itself.
 */
export function sqlRepositoryBase<
  Entity extends { id: string },
  DbModel extends Record<string, unknown>,
  Custom extends AsyncMethods = Record<never, never>,
>(
  { db, tableName, mapper, logger }: SqlRepositoryBaseProps<Entity, DbModel>,
  custom?: CustomMethods<Custom>,
): RepositoryBase<Entity, Custom> {
  const helpers: QueryHelpers = {
    where: (conditions) => whereClause(db, conditions),
    orderBy: (order) => orderByClause(db, order),
  };

  const crud = mapDatabaseErrors({
    async findOneById(id: string): Promise<Entity | undefined> {
      const [result] = await db`SELECT * FROM ${db(tableName)} WHERE id = ${id}`;
      return result ? mapper.toDomain(result as DbModel) : undefined;
    },
    async findAll(): Promise<Entity[]> {
      const records = await db`SELECT * FROM ${db(tableName)}`;
      return records.map((r) => mapper.toDomain(r as DbModel));
    },
    async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>> {
      const [countRow] = await db`SELECT COUNT(*) as total FROM ${db(tableName)}`;
      const result =
        await db`SELECT * FROM ${db(tableName)} ${helpers.orderBy(params.orderBy)} LIMIT ${params.limit} OFFSET ${params.offset}`;
      const entities = result.map((r) => mapper.toDomain(r as DbModel));
      return {
        data: entities,
        count: Number(countRow?.total ?? 0),
        limit: params.limit,
        page: params.page,
      };
    },
    async update(entity: Entity): Promise<Entity> {
      const record = mapper.toPersistence(entity);
      const { id, ...fields } = record as Record<string, unknown> & { id: string };
      const [updated] =
        await db`UPDATE ${db(tableName)} SET ${db(fields)} WHERE id = ${id} RETURNING *`;
      if (!updated) {
        throw new NotFoundException(`Record with id ${id} not found`);
      }
      return mapper.toDomain(updated as DbModel);
    },
    async insert(entity: Entity | Entity[]): Promise<void> {
      const entities = Array.isArray(entity) ? entity : [entity];
      const records = entities.map(mapper.toPersistence);
      await db`INSERT INTO ${db(tableName)} ${db(records as Record<string, unknown>[])}`;
    },
    async delete(entityId: string): Promise<boolean> {
      logger.debug(`[${getRequestId()}] deleting entities ${entityId} from ${tableName}`);
      const result = await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
      return result.count > 0;
    },
  });

  // Custom methods come last, so a repository can also replace a generic one
  const customMethods = custom ? mapDatabaseErrors(custom(helpers)) : ({} as Custom);
  return { ...crud, ...customMethods };
}
