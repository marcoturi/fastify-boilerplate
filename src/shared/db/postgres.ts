import type { FastifyBaseLogger } from 'fastify';
import postgres from 'postgres';
import { env } from '#src/config/index.ts';
import { transactionContext } from '#src/shared/db/transaction-context.ts';

type Sql = ReturnType<typeof postgres>;

let sql: Sql | null = null;
let queryLogger: FastifyBaseLogger | undefined;
const transactions = transactionContext<postgres.TransactionSql>();

/** Logs every SQL query through `logger` at debug level: its text and the number of
 *  parameters, never their values (they can hold personal data). */
export function setQueryLogger(logger: FastifyBaseLogger): void {
  queryLogger = logger;
}

/** Returns the singleton DB connection, creating it lazily on first call. */
export function getDb(): Sql {
  if (!sql) {
    sql = postgres({
      host: env.db.host,
      port: env.db.port,
      username: env.db.user,
      password: env.db.password,
      database: env.db.database,
      ssl: env.db.ssl ? 'require' : false,
      max: env.db.poolMax,
      idle_timeout: env.db.idleTimeout,
      connect_timeout: env.db.connectTimeout,
      debug: (connection: number, query: string, params: unknown[]) => {
        queryLogger?.debug({ connection, params: params.length }, `SQL: ${query.trim()}`);
      },
    });
  }
  return sql;
}

export async function closeDbConnection() {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}

/** The client for the current query: the open transaction inside withTransaction(), else the pool. */
function currentDb(): Sql {
  // A TransactionSql runs queries and helpers like Sql: it only lacks the pool-level methods
  return (transactions.current() as unknown as Sql | undefined) ?? getDb();
}

/**
 * A client that runs each query on the current transaction (inside withTransaction()) or,
 * outside one, on the pool. Registered in DI as `db`, so repositories join transactions
 * without passing `tx` around.
 */
export function transactionAwareDb(): Sql {
  return new Proxy(getDb(), {
    apply: (_target, _thisArg, args) => Reflect.apply(currentDb(), undefined, args),
    get: (_target, property) => Reflect.get(currentDb(), property),
  });
}

/**
 * Runs `fn` in a database transaction: committed if it resolves, rolled back if it throws.
 * Repositories called inside it use the transaction automatically, and a nested call joins
 * the outer transaction. Publish domain events after it resolves, so handlers see the data.
 */
export async function withTransaction<T>(
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  const open = transactions.current();
  if (open) {
    return fn(open);
  }
  return getDb().begin((tx) => transactions.run(tx, () => fn(tx))) as Promise<T>;
}
