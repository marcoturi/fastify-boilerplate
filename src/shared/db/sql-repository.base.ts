import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type {
  OrderBy,
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';
import { type Condition, orderByClause, whereClause } from '#src/shared/db/sql-fragments.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';
import {
  AlreadyExistsException,
  DatabaseErrorException,
  NotFoundException,
} from '#src/shared/exceptions/index.ts';

export interface SqlRepositoryBaseProps<Entity, DbModel> {
  db: Dependencies['db'];
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
  logger: FastifyBaseLogger;
}

/**
 * The generic CRUD of a repository, plus SQL helpers bound to its client for custom queries.
 * Destructure the helpers out before spreading the base into a repository, so they do not
 * become repository methods: `const { where, orderBy, ...base } = repositoryBase(...)`.
 */
export type RepositoryBase<Entity> = RepositoryPort<Entity> & {
  /** WHERE clause joining the set conditions with AND: empty when none is set */
  where(conditions: Condition[]): ReturnType<typeof whereClause>;
  /** Deterministic ORDER BY on the field, with `id` as a tiebreaker */
  orderBy(order: OrderBy): ReturnType<typeof orderByClause>;
};

/** Maps a driver error: a unique violation becomes AlreadyExists, anything else a database error. */
function toDatabaseException(error: unknown) {
  if (error instanceof Error && 'code' in error && error.code === '23505') {
    // https://www.postgresql.org/docs/current/errcodes-appendix.html
    return new AlreadyExistsException('Record already exists', error);
  }
  return new DatabaseErrorException(
    'Unknown database error',
    error instanceof Error ? error : new Error(String(error)),
  );
}

export function SqlRepositoryBase<
  Entity extends { id: string },
  DbModel extends Record<string, unknown>,
>({
  db,
  tableName,
  mapper,
  logger,
}: SqlRepositoryBaseProps<Entity, DbModel>): RepositoryBase<Entity> {
  const where = (conditions: Condition[]) => whereClause(db, conditions);
  const orderBy = (order: OrderBy) => orderByClause(db, order);

  return {
    where,
    orderBy,
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
        await db`SELECT * FROM ${db(tableName)} ${orderBy(params.orderBy)} LIMIT ${params.limit} OFFSET ${params.offset}`;
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
      let updated: unknown;
      try {
        [updated] =
          await db`UPDATE ${db(tableName)} SET ${db(fields)} WHERE id = ${id} RETURNING *`;
      } catch (error: unknown) {
        throw toDatabaseException(error);
      }
      if (!updated) {
        throw new NotFoundException(`Record with id ${id} not found`);
      }
      return mapper.toDomain(updated as DbModel);
    },
    async insert(entity: Entity | Entity[]): Promise<void> {
      const entities = Array.isArray(entity) ? entity : [entity];
      const records = entities.map(mapper.toPersistence);
      try {
        await db`INSERT INTO ${db(tableName)} ${db(records as Record<string, unknown>[])}`;
      } catch (error: unknown) {
        throw toDatabaseException(error);
      }
    },
    async delete(entityId: string): Promise<boolean> {
      logger.debug(`[${getRequestId()}] deleting entities ${entityId} from ${tableName}`);
      const result = await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
      return result.count > 0;
    },
  };
}
