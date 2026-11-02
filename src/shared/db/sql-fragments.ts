import type postgres from 'postgres';

type Fragment = postgres.PendingQuery<postgres.Row[]>;

/** A SQL condition, or a falsy value for a filter that is not set. */
export type Condition = Fragment | false | undefined | null | '';

/** Joins the set conditions with AND into a WHERE clause: empty when none is set. Each one goes
 *  in parentheses, so a condition with an OR cannot change the meaning of the others. */
export function whereClause(db: postgres.Sql, conditions: Condition[]) {
  const set = conditions.filter((condition) => !!condition);
  return set.reduce(
    (clause, condition, i) =>
      i === 0 ? db`WHERE (${condition})` : db`${clause} AND (${condition})`,
    db``,
  );
}
