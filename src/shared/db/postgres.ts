import type { FastifyBaseLogger } from 'fastify';
import postgres from 'postgres';
import { env } from '#src/config/index.ts';
import { transactionContext } from '#src/shared/db/transaction-context.ts';

let sql: postgres.Sql | null = null;
let closed = false;
let queryLogger: FastifyBaseLogger | undefined;
const transactions = transactionContext<postgres.TransactionSql>();

/** Logs through `logger` the Postgres notices and, at debug level, every SQL query: its text
 *  and the number of parameters, never their values (they can hold personal data). */
export function setQueryLogger(logger: FastifyBaseLogger): void {
  queryLogger = logger;
}

/** Returns the singleton DB connection, creating it lazily on first call. After
 *  closeDbConnection() it throws: a late query (e.g. from an event handler still running
 *  at shutdown) would otherwise open a pool that nothing closes. */
export function getDb(): postgres.Sql {
  if (closed) {
    throw new Error('The database connection is closed');
  }
  if (!sql) {
    sql = postgres({
      host: env.db.host,
      port: env.db.port,
      username: env.db.user,
      password: env.db.password,
      database: env.db.database,
      // verify-full also checks the server certificate and host name: 'require' only
      // encrypts, so it would accept a man-in-the-middle
      ssl: env.db.ssl ? 'verify-full' : false,
      max: env.db.poolMax,
      idle_timeout: env.db.idleTimeout,
      connect_timeout: env.db.connectTimeout,
      // The default prints Postgres notices (e.g. "does not exist, skipping") with console.log,
      // a multi-line object in the middle of the JSON logs
      onnotice: (notice) =>
        queryLogger?.info({ code: notice.code, severity: notice.severity }, notice.message),
      // Only at debug level: in debug mode postgres.js also attaches the query parameters to
      // every error it raises, so a raw driver error that reaches a logger would print them
      debug:
        env.log.level === 'debug' &&
        ((connection: number, query: string, params: unknown[]) => {
          queryLogger?.debug({ connection, params: params.length }, `SQL: ${query.trim()}`);
        }),
    });
  }
  return sql;
}

export async function closeDbConnection() {
  closed = true;
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}

/** The client for the current query: the open transaction inside withTransaction(), else the pool. */
function currentDb(): postgres.Sql {
  // A TransactionSql runs queries and helpers like postgres.Sql: it only lacks the pool-level methods
  return (transactions.current() as unknown as postgres.Sql | undefined) ?? getDb();
}

/** The client repositories get. Its pool-level methods are `never`: inside withTransaction()
 *  they do not exist, and a transaction opened with `begin` would not reach the repositories */
export type Db = postgres.Sql &
  Record<'begin' | 'reserve' | 'listen' | 'subscribe' | 'end' | 'close' | 'largeObject', never>;

/**
 * A client that runs each query on the current transaction (inside withTransaction()) or,
 * outside one, on the pool. Registered in DI as `db`, so repositories join transactions
 * without passing `tx` around.
 */
export function transactionAwareDb(): Db {
  return new Proxy(getDb(), {
    apply: (_target, _thisArg, args) => Reflect.apply(currentDb(), undefined, args),
    get: (_target, property) => Reflect.get(currentDb(), property),
  }) as Db;
}

/**
 * Runs `fn` in a database transaction: committed if it resolves, rolled back if it throws.
 * Repositories called inside it use the transaction automatically. A nested call runs in a
 * savepoint: if it throws, only its own work is undone, and the outer transaction can go on
 * when the caller catches the error. Publish domain events after it resolves, so handlers see
 * the data.
 */
export async function withTransaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  const open = transactions.current();
  if (open) {
    return open.savepoint((sp) => transactions.run(sp, () => fn(sp))) as Promise<T>;
  }
  return getDb().begin((tx) => transactions.run(tx, () => fn(tx))) as Promise<T>;
}
