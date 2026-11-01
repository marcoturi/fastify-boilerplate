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

  it('adds meta only when the call passes one', () => {
    const create = actionCreatorFactory('user')<null>('x');
    assert.equal('meta' in create(null), false);
    assert.deepEqual(create(null, { extra: true }).meta, { extra: true });
  });
});
