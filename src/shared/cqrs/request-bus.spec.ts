import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { actionCreatorFactory } from './action-creator.ts';
import type { Action } from './bus.types.ts';
import { requestBus } from './request-bus.ts';

/** A creator for `test/<type>`, as modules make them with their action creator */
const creator = <P = unknown, R = unknown>(type: string) =>
  actionCreatorFactory('test')<P, R>(type);

const makeAction = <P>(type: string, payload: P, meta?: Record<string, unknown>): Action<P> =>
  ({ type: `test/${type}`, payload, meta }) as unknown as Action<P>;

describe('requestBus()', () => {
  it('executes the registered handler and returns its result', async () => {
    const bus = requestBus('Command');
    bus.register(
      creator<{ n: number }, number>('math/double'),
      async (action) => action.payload.n * 2,
    );
    const result = await bus.execute(makeAction('math/double', { n: 21 }));
    assert.equal(result, 42);
  });

  it('types the handler by its creator (checked by tsc)', () => {
    const bus = requestBus('Command');
    const a = creator<{ n: number }, number>('a');
    const b = creator<{ n: number }, number>('b');
    // @ts-expect-error the handler must return the creator's result, not undefined
    bus.register(a, async () => undefined);
    // @ts-expect-error the handler must take the creator's payload
    bus.register(b, async (action: Action<{ s: string }>) => action.payload.s.length);
  });

  it('stamps the correlation id and the timestamp in meta', async () => {
    const bus = requestBus('Query');
    const readMeta = creator<unknown, Action<unknown>['meta']>('t');
    bus.register(readMeta, async (action) => action.meta);
    const meta = await bus.execute(readMeta({}));
    assert.equal(typeof meta?.correlationId, 'string');
    assert.equal(typeof meta?.timestamp, 'number');
  });

  it('rejects when executing an unregistered type', async () => {
    const bus = requestBus('Command');
    await assert.rejects(
      bus.execute(makeAction('missing', {})),
      /Command type of test\/missing is not registered/,
    );
  });

  it('refuses a second handler for the same type', () => {
    const bus = requestBus('Command');
    bus.register(creator('t'), async () => 'first');
    assert.throws(
      () => bus.register(creator('t'), async () => 'second'),
      /Command type of test\/t is already registered/,
    );
  });

  it('lets a middleware enrich the action without mutating the original', async () => {
    const bus = requestBus('Command');
    const original = makeAction('t', { v: 1 });
    let seenMeta: unknown;
    bus.addMiddleware(async (action, next) =>
      next({ ...action, meta: { ...action.meta, tag: 'x' } } as Action<unknown>),
    );
    bus.register(creator('t'), async (action) => {
      seenMeta = action.meta;
      return null;
    });

    await bus.execute(original);

    assert.partialDeepStrictEqual(seenMeta, { tag: 'x' });
    assert.equal(original.meta, undefined);
  });
});
