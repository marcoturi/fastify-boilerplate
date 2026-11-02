import {
  AlreadyExistsException,
  ArgumentInvalidException,
  DatabaseErrorException,
  ExceptionBase,
} from '#src/shared/exceptions/index.ts';

/** Maps a driver error: a unique violation becomes AlreadyExists, a value the column cannot
 *  hold an invalid argument, anything else a database error. Exceptions that are already ours
 *  (e.g. a NotFound thrown on purpose) pass through. */
export function toDatabaseException(error: unknown): ExceptionBase {
  if (error instanceof ExceptionBase) {
    return error;
  }
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (error instanceof Error && 'code' in error) {
    if (error.code === '23505') {
      return new AlreadyExistsException('Record already exists', error);
    }
    // A client value that passed the schema but not the column type: a uuid with a prefix
    // (22P02, invalid_text_representation) or a NUL character (22021): a 400, not a 500
    if (error.code === '22P02' || error.code === '22021') {
      return new ArgumentInvalidException('Invalid value in the input');
    }
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
          // `this` is the object, so a method can call another one through it
          return await method.apply(methods, args);
        } catch (error: unknown) {
          throw toDatabaseException(error);
        }
      },
    ]),
  ) as T;
}
