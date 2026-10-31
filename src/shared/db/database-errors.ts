import {
  AlreadyExistsException,
  DatabaseErrorException,
  ExceptionBase,
} from '#src/shared/exceptions/index.ts';

/** Maps a driver error: a unique violation becomes AlreadyExists, anything else a database
 *  error. Exceptions that are already ours (e.g. a NotFound thrown on purpose) pass through. */
export function toDatabaseException(error: unknown): ExceptionBase {
  if (error instanceof ExceptionBase) {
    return error;
  }
  if (error instanceof Error && 'code' in error && error.code === '23505') {
    // https://www.postgresql.org/docs/current/errcodes-appendix.html
    return new AlreadyExistsException('Record already exists', error);
  }
  return new DatabaseErrorException(
    'Unknown database error',
    error instanceof Error ? error : new Error(String(error)),
  );
}

/** Async methods, such as a repository's */
export type AsyncMethods = Record<string, (...args: never[]) => Promise<unknown>>;

/**
 * Wraps every method so a driver error becomes a domain exception (see toDatabaseException):
 * the methods run plain queries, and handlers never see a PostgresError. The repository base
 * applies it to its own methods and to the custom ones it receives; call it directly only for
 * a repository that does not use the base.
 */
export function mapDatabaseErrors<T extends AsyncMethods>(methods: T): T {
  return Object.fromEntries(
    Object.entries(methods).map(([name, method]) => [
      name,
      async (...args: never[]) => {
        try {
          return await method(...args);
        } catch (error: unknown) {
          throw toDatabaseException(error);
        }
      },
    ]),
  ) as T;
}
