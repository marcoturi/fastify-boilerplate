import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UserFilters } from '#src/modules/user/database/user.repository.port.ts';
import type { PaginatedQueryParams } from '#src/shared/db/repository.port.ts';
import findUsersHandler, { findUsersQuery } from './find-users.handler.ts';
import type { FindUsersRequestDto } from './find-users.schema.ts';

/** Runs the handler with a fake repository and returns what the repository received */
async function run(payload: FindUsersRequestDto) {
  const calls: { params: PaginatedQueryParams; filters: UserFilters }[] = [];
  const userRepository = {
    findAllPaginatedFiltered: async (params: PaginatedQueryParams, filters: UserFilters) => {
      calls.push({ params, filters });
      return { data: [], count: 0, limit: params.limit, page: params.page };
    },
  };
  const { handler } = findUsersHandler({ userRepository } as unknown as Dependencies);
  await handler(findUsersQuery(payload));
  assert.equal(calls.length, 1);
  return calls[0]!;
}

describe('findUsersHandler()', () => {
  it('passes the filters and the pagination to the repository', async () => {
    const { params, filters } = await run({ country: 'Italy', limit: 5, page: 2 });
    assert.deepEqual(filters, { country: 'Italy', postalCode: undefined, street: undefined });
    assert.equal(params.limit, 5);
    assert.equal(params.offset, 10);
  });

  it('ignores fields the request schema does not declare, such as orderBy', async () => {
    const payload = {
      orderBy: { field: 'email; DROP TABLE users', param: 'asc' },
      offset: 1000,
    } as unknown as FindUsersRequestDto;
    const { params } = await run(payload);
    assert.deepEqual(params.orderBy, { field: 'createdAt', param: 'desc' });
    assert.equal(params.offset, 0);
  });
});
