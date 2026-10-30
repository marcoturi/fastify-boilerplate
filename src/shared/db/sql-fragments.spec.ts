import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { orderByClause, whereClause } from './sql-fragments.ts';

type Rendered = { strings: readonly string[]; values: unknown[] } | { identifier: string };

/** Fake postgres.js client: records tagged templates and identifiers so they can be rendered. */
const db = ((first: unknown, ...values: unknown[]) =>
  Array.isArray(first) && 'raw' in first
    ? { strings: first, values }
    : { identifier: first }) as unknown as Parameters<typeof whereClause>[0];

/** Renders a recorded fragment as SQL text, with values quoted inline (e.g. 'a'). */
const render = (fragment: unknown): string => {
  const node = fragment as Rendered;
  if ('identifier' in node) return `"${node.identifier}"`;
  return node.strings
    .map((text, i) => {
      if (i >= node.values.length) return text;
      const value = node.values[i];
      const inner = typeof value === 'object' && value !== null ? render(value) : `'${value}'`;
      return text + inner;
    })
    .join('')
    .trim();
};

const condition = (text: string) => db`${text}` as never;

describe('whereClause()', () => {
  it('is empty when no condition is set', () => {
    assert.equal(render(whereClause(db, [false, undefined, null, ''])), '');
  });

  it('joins the set conditions with AND, skipping the unset ones', () => {
    const clause = whereClause(db, [condition('a'), undefined, condition('b')]);
    assert.equal(render(clause), "WHERE 'a' AND 'b'");
  });
});

describe('orderByClause()', () => {
  it('orders by the field, then by id, in the requested direction', () => {
    assert.equal(
      render(orderByClause(db, { field: 'createdAt', param: 'asc' })),
      'ORDER BY "createdAt" ASC, id ASC',
    );
  });

  it('falls back to DESC for anything but asc', () => {
    const injected = { field: 'createdAt', param: 'asc; DROP TABLE users' } as never;
    assert.equal(render(orderByClause(db, injected)), 'ORDER BY "createdAt" DESC, id DESC');
  });
});
