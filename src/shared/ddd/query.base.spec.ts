import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paginatedQuery } from './query.base.ts';

describe('paginatedQuery()', () => {
  it('applies the defaults when no pagination is given', () => {
    const query = paginatedQuery({});
    assert.equal(query.limit, 20);
    assert.equal(query.page, 0);
    assert.equal(query.offset, 0);
    assert.deepEqual(query.orderBy, { field: 'createdAt', param: 'desc' });
  });

  it('computes the offset from page and limit', () => {
    const query = paginatedQuery({ limit: 10, page: 3 });
    assert.equal(query.offset, 30);
  });

  it('applies the defaults to explicit nulls and undefined values', () => {
    const props: { limit?: number; page?: number } = {
      limit: null as unknown as number,
      page: undefined,
    };
    const query = paginatedQuery(props);
    assert.equal(query.limit, 20);
    assert.equal(query.page, 0);
    assert.equal(query.offset, 0);
  });

  it('returns the pagination only, computing the offset whatever the request carries', () => {
    const request = { limit: 10, page: 2, offset: 999, country: 'Italy' };
    assert.deepEqual(paginatedQuery(request), {
      limit: 10,
      page: 2,
      offset: 20,
      orderBy: { field: 'createdAt', param: 'desc' },
    });
  });
});
