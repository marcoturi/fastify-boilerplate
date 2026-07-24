import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { actionCreatorFactory } from './action-creator.ts';

describe('actionCreatorFactory()', () => {
  it('prefixes the action type with the module name', () => {
    const create = actionCreatorFactory('user');
    const createUser = create<{ email: string }>('create');

    assert.equal(createUser.type, 'user/create');

    const action = createUser({ email: 'a@b.c' });
    assert.equal(action.type, 'user/create');
    assert.deepEqual(action.payload, { email: 'a@b.c' });
  });

  it('works without a prefix', () => {
    const create = actionCreatorFactory();
    const ping = create<null>('ping');
    assert.equal(ping.type, 'ping');
  });

  it('omits meta when neither common nor per-call meta is provided', () => {
    const create = actionCreatorFactory('user');
    const action = create<null>('x')(null);
    assert.equal('meta' in action, false);
  });

  it('merges common meta with per-call meta', () => {
    const create = actionCreatorFactory('user');
    const withCommonMeta = create<null>('x', { source: 'test' });
    const action = withCommonMeta(null, { extra: true });
    assert.deepEqual(action.meta, { source: 'test', extra: true });
  });
});
