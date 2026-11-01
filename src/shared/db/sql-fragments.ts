import type postgres from 'postgres';
import type { OrderBy } from '#src/shared/db/repository.port.ts';

type Sql = ReturnType<typeof postgres>;
type Fragment = postgres.PendingQuery<postgres.Row[]>;

/** A SQL condition, or a falsy value for a filter that is not set. */
export type Condition = Fragment | false | undefined | null | '';

/** Joins the set conditions with AND into a WHERE clause: empty when none is set. Each one goes
 *  in parentheses, so a condition with an OR cannot change the meaning of the others. */
export function whereClause(db: Sql, conditions: Condition[]) {
  const set = conditions.filter(Boolean) as Fragment[];
  return set.reduce(
    (clause, condition, i) =>
      i === 0 ? db`WHERE (${condition})` : db`${clause} AND (${condition})`,
    db``,
  );
}

/**
 * Builds a deterministic ORDER BY: the requested column, then `id` as a tiebreaker, so rows
 * with equal values (e.g. the same createdAt) keep a stable order across pages.
 * The column goes through identifier escaping and the direction is whitelisted.
 */
export function orderByClause(db: Sql, { field, param }: OrderBy) {
  const direction = param === 'asc' ? db`ASC` : db`DESC`;
  return db`ORDER BY ${db(field)} ${direction}, id ${direction}`;
}
