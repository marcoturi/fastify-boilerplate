import { LogLevel } from '#src/config/env.ts';
import { env } from '#src/config/index.ts';
import postgres from 'postgres';

const sql = postgres(env.db.url, {
  debug: (conn: number, query: string, params: unknown[], paramTypes: unknown[]) => {
    if (env.log.level === LogLevel.debug) {
      // biome-ignore lint/suspicious/noConsole: needed for debugging
      console.debug(`
    SQL::
      Executing query: "${query.trim()}"
      Params: ${JSON.stringify(params)}
      Param Types: ${JSON.stringify(paramTypes)}
      Connection: ${conn}
    `);
    }
  },
});

export async function closeDbConnection() {
  await sql.end({ timeout: 5 });
}

export const joinConditions = (xs: (string | false | undefined | null)[], joiner = sql`AND`) => {
  const filtered = xs.filter(Boolean) as string[];

  // Check if the filtered array has any elements (length > 0)
  if (filtered.length === 0) {
    return sql``;
  }

  // Prepend "WHERE" to the beginning of the flattened array
  return [sql`WHERE`, ...filtered.flatMap((x, i) => (i ? [joiner, sql`${x}`] : sql`${x}`))];
};

export default sql;
