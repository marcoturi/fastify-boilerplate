import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { describe, it } from 'node:test';
import type { FastifyBaseLogger } from 'fastify';
import { actionCreatorFactory } from './action-creator.ts';
import type { Action } from './bus.types.ts';
import { eventBus } from './event-bus.ts';

/** A creator for `test/<type>`, as modules make them with their action creator */
const creator = <P = unknown, R = void>(type: string) => actionCreatorFactory('test')<P, R>(type);

const makeEvent = <P>(type: string, payload: P): Action<P, void> =>
  ({ type: `test/${type}`, payload }) as unknown as Action<P, void>;

const fakeLogger = () => {
  const debugCalls: string[] = [];
  const errorCalls: { obj: unknown; msg: string }[] = [];
  const logger = {
    debug: (msg: string) => debugCalls.push(String(msg)),
    error: (obj: unknown, msg?: string) => errorCalls.push({ obj, msg: String(msg ?? obj) }),
  } as unknown as FastifyBaseLogger;
  return { logger, debugCalls, errorCalls };
};

/** Yields to the event loop until `predicate` holds or the tick budget is exhausted. */
const flushUntil = async (predicate: () => boolean, ticks = 50): Promise<void> => {
  for (let i = 0; i < ticks && !predicate(); i++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
};

describe('eventBus()', () => {
  it('invokes every handler registered for a type', () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const received: number[] = [];
    bus.on(creator<{ n: number }>('user/created'), (event) => {
      received.push(event.payload.n);
    });
    bus.on(creator<{ n: number }>('user/created'), (event) => {
      received.push(event.payload.n + 1);
    });

    bus.emit(makeEvent('user/created', { n: 10 }));

    assert.deepEqual(received, [10, 11]);
  });

  it('logs at debug when no handler is registered', () => {
    const { logger, debugCalls } = fakeLogger();
    const bus = eventBus({ logger });

    bus.emit(makeEvent('nobody/listening', {}));

    assert.equal(debugCalls.length, 1);
    const [firstDebug] = debugCalls;
    assert.ok(firstDebug);
    assert.match(firstDebug, /nobody\/listening/);
  });

  it('runs middlewares before the handler', () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const order: string[] = [];
    bus.addMiddleware((event, next) => {
      order.push('middleware');
      return next(event);
    });
    bus.on(creator('t'), () => {
      order.push('handler');
    });

    bus.emit(makeEvent('t', {}));

    assert.deepEqual(order, ['middleware', 'handler']);
  });

  it('isolates and logs a failing async handler instead of rejecting', async () => {
    const { logger, errorCalls } = fakeLogger();
    const bus = eventBus({ logger });
    bus.on(creator('t'), async () => {
      throw new Error('boom');
    });

    assert.doesNotThrow(() => bus.emit(makeEvent('t', {})));

    await flushUntil(() => errorCalls.length > 0);
    assert.equal(errorCalls.length, 1);
    const [firstError] = errorCalls;
    assert.ok(firstError);
    assert.match(firstError.msg, /failed/);
  });

  it('processes same-key events sequentially, in emit order', async () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const done: string[] = [];
    bus.on(
      creator<{ id: string; label: string }>('job'),
      async (event) => {
        await new Promise((resolve) => setImmediate(resolve));
        done.push(event.payload.label);
      },
      { keyExtractor: (event) => event.payload.id },
    );

    bus.emit(makeEvent('job', { id: 'a', label: 'a1' }));
    bus.emit(makeEvent('job', { id: 'a', label: 'a2' }));
    bus.emit(makeEvent('job', { id: 'a', label: 'a3' }));

    await flushUntil(() => done.length === 3);
    assert.deepEqual(done, ['a1', 'a2', 'a3']);
  });

  it('stamps the metadata once, when the event is emitted', async () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    // The timestamps each event's subscribers saw, by label
    const seen: Record<string, unknown[]> = { first: [], second: [] };
    let releaseFirst: () => void = () => undefined;
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    bus.on(
      creator<{ label: string }>('job'),
      async (event) => {
        // Holds the queue, so the second event waits for its turn
        if (event.payload.label === 'first') await firstHeld;
        seen[event.payload.label]?.push(event.meta?.timestamp);
      },
      { keyExtractor: () => 'k' },
    );
    bus.on(creator<{ label: string }>('job'), (event) => {
      seen[event.payload.label]?.push(event.meta?.timestamp);
    });

    bus.emit(makeEvent('job', { label: 'first' }));
    bus.emit(makeEvent('job', { label: 'second' }));
    const emittedAt = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 10));
    releaseFirst();

    await flushUntil(() => seen.first?.length === 2 && seen.second?.length === 2);
    // Both subscribers see the same stamp, and the queued event keeps its emit time
    for (const [label, [queued, direct]] of Object.entries(seen)) {
      assert.equal(typeof queued, 'number', label);
      assert.equal(queued, direct, label);
      assert.ok((queued as number) <= emittedAt, label);
    }
  });

  it('drain() waits for the running handlers, also those of events emitted meanwhile', async () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const tick = () => new Promise((resolve) => setImmediate(resolve));
    const done: string[] = [];
    bus.on(creator('first'), async () => {
      await tick();
      bus.emit(makeEvent('second', {}));
      done.push('first');
    });
    bus.on(creator('second'), async () => {
      await tick();
      done.push('second');
    });
    bus.on(
      creator('queued'),
      async () => {
        await tick();
        done.push('queued');
      },
      { keyExtractor: () => 'k' },
    );

    bus.emit(makeEvent('first', {}));
    bus.emit(makeEvent('queued', {}));
    await bus.drain();

    assert.deepEqual(done.sort(), ['first', 'queued', 'second']);
  });

  it('drain() resolves at once when no handler is running', async () => {
    const { logger } = fakeLogger();
    await eventBus({ logger }).drain();
  });

  it('runs each queued event in the async context it was emitted in', async () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    // Stands in for the per-request stores (request context, OTel) built on AsyncLocalStorage
    const requestStore = new AsyncLocalStorage<string>();
    const seen: string[] = [];
    let releaseFirst: () => void = () => undefined;
    const firstHeld = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    bus.on(
      creator<{ id: string; label: string }>('job'),
      async (event) => {
        // Holds the drain loop started by request A, so B's event is queued behind it
        if (event.payload.label === 'a') await firstHeld;
        seen.push(`${event.payload.label}@${requestStore.getStore()}`);
      },
      { keyExtractor: (event) => event.payload.id },
    );

    requestStore.run('request-A', () => bus.emit(makeEvent('job', { id: 'k', label: 'a' })));
    requestStore.run('request-B', () => bus.emit(makeEvent('job', { id: 'k', label: 'b' })));
    releaseFirst();

    await flushUntil(() => seen.length === 2);
    assert.deepEqual(seen, ['a@request-A', 'b@request-B']);
  });
});
