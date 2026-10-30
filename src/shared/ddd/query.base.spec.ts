import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paginatedQueryBase } from './query.base.ts';

describe('paginatedQueryBase()', () => {
  it('applies the defaults when no pagination is given', () => {
    const query = paginatedQueryBase({});
    assert.equal(query.limit, 20);
    assert.equal(query.page, 0);
    assert.equal(query.offset, 0);
    assert.deepEqual(query.orderBy, { field: 'createdAt', param: 'desc' });
  });

  it('computes the offset from page and limit', () => {
    const query = paginatedQueryBase({ limit: 10, page: 3 });
    assert.equal(query.offset, 30);
  });

  it('applies the defaults to explicit nulls and undefined values', () => {
    const props: { limit?: number; page?: number } = {
      limit: null as unknown as number,
      page: undefined,
    };
    const query = paginatedQueryBase(props);
    assert.equal(query.limit, 20);
    assert.equal(query.page, 0);
    assert.equal(query.offset, 0);
  });

  it('does not let caller input override the computed offset', () => {
    const query = paginatedQueryBase({ limit: 10, page: 2, offset: 999 });
    assert.equal(query.offset, 20);
  });

  it('keeps the extra props of the caller', () => {
    const query = paginatedQueryBase({ limit: 5, country: 'Italy' });
    assert.equal(query.country, 'Italy');
  });
});
