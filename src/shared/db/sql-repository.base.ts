import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type {
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '#src/shared/db/repository.port.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';
import { ConflictException, DatabaseErrorException } from '#src/shared/exceptions/index.ts';
import type { FastifyBaseLogger } from 'fastify';

export interface SqlRepositoryBaseProps<Entity, DbModel> {
  db: Dependencies['db'];
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
  logger: FastifyBaseLogger;
}

export function SqlRepositoryBase<
  Entity extends { id: string },
  DbModel extends Record<string, unknown>,
>({
  db,
  tableName,
  mapper,
  logger,
}: SqlRepositoryBaseProps<Entity, DbModel>): RepositoryPort<Entity> {
  return {
    async findOneById(id: string): Promise<Entity | undefined> {
      const [result] = await db`SELECT * FROM ${db(tableName)} WHERE id = ${id}`;
      return result ? mapper.toDomain(result as DbModel) : undefined;
    },
    async findAll(): Promise<Entity[]> {
      const records = await db`SELECT * FROM ${db(tableName)}`;
      return records.map((r) => mapper.toDomain(r as DbModel));
    },
    async findAllPaginated(params: PaginatedQueryParams): Promise<Paginated<Entity>> {
      const [{ total }] = await db`SELECT COUNT(*) as total FROM ${db(tableName)}`;
      const result =
        await db`SELECT * FROM ${db(tableName)} LIMIT ${params.limit} OFFSET ${params.offset}`;
      const entities = result.map((r) => mapper.toDomain(r as DbModel));
      return {
        data: entities,
        count: Number(total),
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
        throw new DatabaseErrorException(`Record with id ${id} not found for update`);
      }
      return mapper.toDomain(updated as DbModel);
    },
    async insert(entity: Entity | Entity[]): Promise<void> {
      const entities = Array.isArray(entity) ? entity : [entity];
      const records = entities.map(mapper.toPersistence);
      try {
        await db`INSERT INTO ${db(tableName)} ${db(records as Record<string, unknown>[])}`;
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === '23505') {
          // https://www.postgresql.org/docs/current/errcodes-appendix.html
          throw new ConflictException('Record already exists', error);
        }
        throw new DatabaseErrorException(
          'Unknown database error',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },
    async delete(entityId: string): Promise<boolean> {
      logger.debug(`[${getRequestId()}] deleting entities ${entityId} from ${tableName}`);
      const result = await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
      return result.count > 0;
    },
  };
}
