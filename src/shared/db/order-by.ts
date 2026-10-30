import type postgres from 'postgres';
import type { OrderBy } from '#src/shared/db/repository.port.ts';

/**
 * Builds a deterministic ORDER BY: the requested column, then `id` as a tiebreaker, so rows
 * with equal values (e.g. the same createdAt) keep a stable order across pages.
 * The column goes through identifier escaping and the direction is whitelisted.
 */
export function orderByClause(db: ReturnType<typeof postgres>, { field, param }: OrderBy) {
  const direction = param === 'asc' ? db`ASC` : db`DESC`;
  return db`ORDER BY ${db(field)} ${direction}, id ${direction}`;
}
