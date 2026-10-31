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

export interface RepositoryProps<Entity, DbModel> {
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
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
 * Binds the repository base to a client. The function it returns builds a repository: the
 * generic CRUD, plus the custom methods `custom` returns from the query helpers. Every method
 * maps driver errors to domain exceptions (see mapDatabaseErrors), custom ones included, so a
 * repository never wraps them itself.
 */
export function sqlRepositoryBase(db: Dependencies['db']) {
  const helpers: QueryHelpers = {
    where: (conditions) => whereClause(db, conditions),
    orderBy: (order) => orderByClause(db, order),
  };

  return function repositoryBase<
    Entity extends { id: string },
    DbModel extends Record<string, unknown>,
    Custom extends AsyncMethods = Record<never, never>,
  >(
    { tableName, mapper }: RepositoryProps<Entity, DbModel>,
    custom?: CustomMethods<Custom>,
  ): RepositoryBase<Entity, Custom> {
    const crud = mapDatabaseErrors({
      async findOneById(id: string): Promise<Entity | undefined> {
        const [result] = await db<DbModel[]>`SELECT * FROM ${db(tableName)} WHERE id = ${id}`;
        return result ? mapper.toDomain(result) : undefined;
      },
      async findAll(): Promise<Entity[]> {
        const records = await db<DbModel[]>`SELECT * FROM ${db(tableName)}`;
        return records.map(mapper.toDomain);
      },
      async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>> {
        const [countRow] = await db`SELECT COUNT(*) as total FROM ${db(tableName)}`;
        const result = await db<DbModel[]>`
          SELECT * FROM ${db(tableName)} ${helpers.orderBy(params.orderBy)}
            LIMIT ${params.limit} OFFSET ${params.offset}
        `;
        return {
          data: result.map(mapper.toDomain),
          count: Number(countRow?.total ?? 0),
          limit: params.limit,
          page: params.page,
        };
      },
      async update(entity: Entity): Promise<Entity> {
        // postgres.js helpers do not type-check a generic record: they take a plain one
        const { id: _, ...fields } = mapper.toPersistence(entity) as Record<string, unknown>;
        const [updated] = await db<DbModel[]>`
          UPDATE ${db(tableName)} SET ${db(fields)} WHERE id = ${entity.id} RETURNING *
        `;
        if (!updated) {
          throw new NotFoundException(`Record with id ${entity.id} not found`);
        }
        return mapper.toDomain(updated);
      },
      async insert(entity: Entity | Entity[]): Promise<void> {
        const entities = Array.isArray(entity) ? entity : [entity];
        const records = entities.map(mapper.toPersistence) as Record<string, unknown>[];
        await db`INSERT INTO ${db(tableName)} ${db(records)}`;
      },
      async delete(entityId: string): Promise<boolean> {
        const result = await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
        return result.count > 0;
      },
    });

    // Custom methods come last, so a repository can also replace a generic one
    const customMethods = custom ? mapDatabaseErrors(custom(helpers)) : ({} as Custom);
    return { ...crud, ...customMethods };
  };
}
