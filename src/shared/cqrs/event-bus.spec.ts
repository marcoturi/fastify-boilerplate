import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FastifyBaseLogger } from 'fastify';
import type { Action } from './bus.types.ts';
import { eventBus } from './event-bus.ts';

const makeEvent = <P>(type: string, payload: P): Action<P> =>
  ({ type, payload }) as unknown as Action<P>;

const fakeLogger = () => {
  const debugCalls: string[] = [];
  const logger = {
    debug: (msg: string) => debugCalls.push(String(msg)),
  } as unknown as FastifyBaseLogger;
  return { logger, debugCalls };
};

describe('eventBus()', () => {
  it('invokes every handler registered for a type', () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const received: number[] = [];
    bus.on<{ n: number }>('user/created', (event) => received.push(event.payload.n));
    bus.on<{ n: number }>('user/created', (event) => received.push(event.payload.n + 1));

    bus.emit(makeEvent('user/created', { n: 10 }));

    assert.deepEqual(received, [10, 11]);
  });

  it('logs at debug when no handler is registered', () => {
    const { logger, debugCalls } = fakeLogger();
    const bus = eventBus({ logger });

    bus.emit(makeEvent('nobody/listening', {}));

    assert.equal(debugCalls.length, 1);
    assert.match(debugCalls[0], /nobody\/listening/);
  });

  it('validates its arguments', () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    assert.throws(() => bus.on(1 as unknown as string, () => undefined), TypeError);
    assert.throws(() => bus.on('t', 'x' as unknown as () => void), TypeError);
    assert.throws(() => bus.emit(null as unknown as Action<unknown>), TypeError);
    assert.throws(() => bus.emit({ payload: {} } as unknown as Action<unknown>), TypeError);
  });

  it('runs middlewares before the handler', () => {
    const { logger } = fakeLogger();
    const bus = eventBus({ logger });
    const order: string[] = [];
    bus.addMiddleware((event, next) => {
      order.push('middleware');
      next(event);
    });
    bus.on('t', () => order.push('handler'));

    bus.emit(makeEvent('t', {}));

    assert.deepEqual(order, ['middleware', 'handler']);
  });
});
