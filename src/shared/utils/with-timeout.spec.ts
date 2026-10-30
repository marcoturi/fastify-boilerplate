import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { withTimeout } from './with-timeout.ts';

describe('withTimeout()', () => {
  it('resolves with the value of a promise that settles in time', async () => {
    assert.equal(await withTimeout(Promise.resolve(42), 100, 'too slow'), 42);
  });

  it('rejects with the error of a promise that fails in time', async () => {
    await assert.rejects(withTimeout(Promise.reject(new Error('boom')), 100, 'too slow'), /boom/);
  });

  it('rejects with the timeout message when the promise takes too long', async () => {
    const never = new Promise<never>(() => undefined);
    await assert.rejects(withTimeout(never, 10, 'too slow'), /too slow/);
  });
});
