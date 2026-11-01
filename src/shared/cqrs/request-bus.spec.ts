import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { actionCreatorFactory } from './action-creator.ts';
import type { Action, CommandHandler } from './bus.types.ts';
import { requestBus } from './request-bus.ts';

/** A creator for `type`, as modules make them with their action creator */
const creator = <P = unknown, R = unknown>(type: string) => actionCreatorFactory()<P, R>(type);

const makeAction = <P>(type: string, payload: P, meta?: Record<string, unknown>): Action<P> =>
  ({ type, payload, meta }) as unknown as Action<P>;

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
    const double = creator<{ n: number }, number>('math/double');
    // @ts-expect-error the handler must return the creator's result, not undefined
    bus.register(double, async () => undefined);
    bus.unregister(double);
    // @ts-expect-error the handler must take the creator's payload
    bus.register(double, async (action: Action<{ s: string }>) => action.payload.s.length);
  });

  it('rejects when executing an unregistered type', async () => {
    const bus = requestBus('Command');
    await assert.rejects(
      bus.execute(makeAction('missing', {})),
      /Command type of missing is not registered/,
    );
  });

  it('refuses a second handler for the same type', () => {
    const bus = requestBus('Command');
    bus.register(creator('t'), async () => 'first');
    assert.throws(
      () => bus.register(creator('t'), async () => 'second'),
      /Command type of t is already registered/,
    );
  });

  it('unregister removes the handler', async () => {
    const bus = requestBus('Query');
    bus.register(creator('q'), async () => 'ok');
    bus.unregister(creator('q'));
    await assert.rejects(bus.execute(makeAction('q', {})), /Query type of q is not registered/);
  });

  it('validates its arguments', async () => {
    const bus = requestBus('Command');
    assert.throws(() => bus.register(123 as never, async () => null), TypeError);
    assert.throws(() => bus.register(creator('t'), 'nope' as unknown as CommandHandler), TypeError);
    await assert.rejects(bus.execute(null as unknown as Action<unknown>), TypeError);
    await assert.rejects(bus.execute({ payload: {} } as unknown as Action<unknown>), TypeError);
  });

  it('applies middlewares as an onion — first added is outermost', async () => {
    const bus = requestBus('Command');
    const order: string[] = [];
    bus.addMiddleware(async (action, next) => {
      order.push('outer:before');
      const result = await next(action);
      order.push('outer:after');
      return result;
    });
    bus.addMiddleware(async (action, next) => {
      order.push('inner:before');
      const result = await next(action);
      order.push('inner:after');
      return result;
    });
    bus.register(creator('t'), async () => {
      order.push('handler');
      return 'done';
    });

    const result = await bus.execute(makeAction('t', {}));

    assert.equal(result, 'done');
    assert.deepEqual(order, [
      'outer:before',
      'inner:before',
      'handler',
      'inner:after',
      'outer:after',
    ]);
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

    assert.deepEqual(seenMeta, { tag: 'x' });
    assert.equal(original.meta, undefined);
  });
});
