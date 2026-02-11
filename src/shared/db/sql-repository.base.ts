import { getRequestId } from '@/shared/app/app-request-context';
import type {
  Paginated,
  PaginatedQueryParams,
  RepositoryPort,
} from '@/shared/db/repository.port';
import type { Mapper } from '@/shared/ddd/mapper.interface';
import {
  ConflictException,
  DatabaseErrorException,
} from '@/shared/exceptions/index';

export interface SqlRepositoryBaseProps<Entity, DbModel> {
  db: Dependencies['db'];
  tableName: string;
  mapper: Mapper<Entity, DbModel>;
  logger: any;
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
      const [result] =
        await db`SELECT * FROM ${db(tableName)} WHERE id = ${id}`;
      return result ? mapper.toDomain(result) : undefined;
    },
    async findAll(): Promise<Entity[]> {
      const records = await db`SELECT * FROM ${tableName}`;
      return records.map(mapper.toDomain);
    },
    async findAllPaginated(
      params: PaginatedQueryParams,
    ): Promise<Paginated<Entity>> {
      const result =
        await db`SELECT * FROM ${tableName} LIMIT ${params.limit} OFFSET ${params.offset}`;
      const entities = result.map(mapper.toDomain);
      return {
        data: entities,
        count: entities.length || 0,
        limit: params.limit,
        page: params.page,
      };
    },
    async insert(entity: Entity | Entity[]): Promise<void> {
      const entities = Array.isArray(entity) ? entity : [entity];
      const records = entities.map(mapper.toPersistence);
      try {
        await db`INSERT INTO ${db(tableName)} ${db(records as any[])}`;
      } catch (error: any) {
        if (error.code === '23505') {
          // https://www.postgresql.org/docs/current/errcodes-appendix.html
          throw new ConflictException('Record already exists', error);
        }
        throw new DatabaseErrorException('Unknown database error', error);
      }
    },
    async delete(entityId: string): Promise<boolean> {
      logger.debug(
        `[${getRequestId()}] deleting entities ${entityId} from ${tableName}`,
      );
      const result =
        await db`DELETE FROM ${db(tableName)} WHERE id = ${entityId}`;
      return result.count > 0;
    },
  };
}
