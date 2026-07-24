import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { composeMiddlewares } from './compose-middlewares.ts';

describe('composeMiddlewares()', () => {
  it('returns the handler result when there are no middlewares', async () => {
    const composed = composeMiddlewares<{ n: number }, (a: { n: number }) => Promise<number>>([]);
    const result = await composed({ n: 5 }, async (a) => a.n * 2);
    assert.equal(result, 10);
  });

  it('wraps middlewares as an onion — first in the array is outermost', async () => {
    interface A {
      id: number;
    }
    type H = (a: A) => Promise<string>;
    const order: string[] = [];

    const composed = composeMiddlewares<A, H>([
      async (a, next) => {
        order.push('first:in');
        const result = await next(a);
        order.push('first:out');
        return result;
      },
      async (a, next) => {
        order.push('second:in');
        const result = await next(a);
        order.push('second:out');
        return result;
      },
    ]);

    const result = await composed({ id: 1 }, async () => {
      order.push('handler');
      return 'ok';
    });

    assert.equal(result, 'ok');
    assert.deepEqual(order, ['first:in', 'second:in', 'handler', 'second:out', 'first:out']);
  });
});
