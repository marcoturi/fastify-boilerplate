import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FastifyBaseLogger } from 'fastify';
import type { Action, CommandHandler, Middleware } from './bus.types.ts';
import { composeMiddlewares, trackExecutionTimeMiddleware } from './middlewares.ts';

const action = { type: 'user/create', payload: {} } as unknown as Action<unknown>;

const fakeLogger = () => {
  const messages: string[] = [];
  const logger = { debug: (msg: string) => messages.push(msg) } as unknown as FastifyBaseLogger;
  return { logger, messages };
};

describe('trackExecutionTimeMiddleware()', () => {
  it('returns the handler result and logs the duration', async () => {
    const { logger, messages } = fakeLogger();
    const result = await trackExecutionTimeMiddleware(logger)(action, async () => 42);
    assert.equal(result, 42);
    assert.match(messages[0] ?? '', /Action user\/create took [\d.]+ms/);
  });

  it('logs the duration of a failing handler too, and rethrows', async () => {
    const { logger, messages } = fakeLogger();
    const failing: CommandHandler = async () => {
      throw new Error('boom');
    };
    await assert.rejects(trackExecutionTimeMiddleware(logger)(action, failing), /boom/);
    assert.equal(messages.length, 1);
  });
});

describe('composeMiddlewares()', () => {
  it('returns the handler result when there are no middlewares', async () => {
    assert.equal(await composeMiddlewares([])(action, async () => 10), 10);
  });

  it('wraps middlewares as an onion — first in the array is outermost', async () => {
    const order: string[] = [];
    const step =
      (name: string): Middleware =>
      async (a, next) => {
        order.push(`${name}:in`);
        const result = await next(a);
        order.push(`${name}:out`);
        return result;
      };

    const result = await composeMiddlewares([step('first'), step('second')])(action, async () => {
      order.push('handler');
      return 'ok';
    });

    assert.equal(result, 'ok');
    assert.deepEqual(order, ['first:in', 'second:in', 'handler', 'second:out', 'first:out']);
  });
});
