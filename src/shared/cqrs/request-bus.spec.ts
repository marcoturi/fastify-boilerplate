import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Action, CommandHandler } from './bus.types.ts';
import { createRequestBus } from './request-bus.ts';

const makeAction = <P>(type: string, payload: P, meta?: Record<string, unknown>): Action<P> =>
  ({ type, payload, meta }) as unknown as Action<P>;

describe('createRequestBus()', () => {
  it('executes the registered handler and returns its result', async () => {
    const bus = createRequestBus('Command');
    bus.register<{ n: number }>('math/double', async (action) => action.payload.n * 2);
    const result = await bus.execute(makeAction('math/double', { n: 21 }));
    assert.equal(result, 42);
  });

  // `execute` throws synchronously (it does not return a rejected promise) for
  // registration/validation errors, so these assert on a synchronous throw.
  it('throws when executing an unregistered type', () => {
    const bus = createRequestBus('Command');
    assert.throws(
      () => bus.execute(makeAction('missing', {})),
      /Command type of missing is not registered/,
    );
  });

  it('unregister removes the handler', () => {
    const bus = createRequestBus('Query');
    bus.register('q', async () => 'ok');
    bus.unregister('q');
    assert.throws(() => bus.execute(makeAction('q', {})), /Query type of q is not registered/);
  });

  it('validates its arguments', () => {
    const bus = createRequestBus('Command');
    assert.throws(() => bus.register(123 as unknown as string, async () => null), TypeError);
    assert.throws(() => bus.register('t', 'nope' as unknown as CommandHandler), TypeError);
    assert.throws(() => bus.execute(null as unknown as Action<unknown>), TypeError);
    assert.throws(() => bus.execute({ payload: {} } as unknown as Action<unknown>), TypeError);
  });

  it('applies middlewares as an onion — first added is outermost', async () => {
    const bus = createRequestBus('Command');
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
    bus.register('t', async () => {
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
    const bus = createRequestBus('Command');
    const original = makeAction('t', { v: 1 });
    let seenMeta: unknown;
    bus.addMiddleware(async (action, next) =>
      next({ ...action, meta: { ...action.meta, tag: 'x' } } as Action<unknown>),
    );
    bus.register('t', async (action) => {
      seenMeta = action.meta;
      return null;
    });

    await bus.execute(original);

    assert.deepEqual(seenMeta, { tag: 'x' });
    assert.equal(original.meta, undefined);
  });
});
