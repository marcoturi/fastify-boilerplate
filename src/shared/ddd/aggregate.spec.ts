import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Action, EventPublisher } from '#src/shared/cqrs/bus.types.ts';
import { withEvents } from './aggregate.ts';

const action = (type: string): Action<unknown> =>
  ({ type, payload: {} }) as unknown as Action<unknown>;

const stubPublisher = () => {
  const emitted: Action<unknown>[] = [];
  const publisher: EventPublisher = {
    emit: (a) => {
      emitted.push(a);
    },
  };
  return { publisher, emitted };
};

describe('withEvents()', () => {
  it('carries the entity and its recorded events', () => {
    const event = action('a');
    const result = withEvents({ id: '1' }, [event]);
    assert.deepEqual(result.entity, { id: '1' });
    assert.deepEqual(result.events, [event]);
  });

  it('commit() publishes every recorded event on the publisher, in order', async () => {
    const { publisher, emitted } = stubPublisher();
    const a = action('a');
    const b = action('b');
    await withEvents({ id: '1' }, [a, b]).commit(publisher);
    assert.deepEqual(emitted, [a, b]);
  });

  it('commit() is a no-op when there are no events', async () => {
    const { publisher, emitted } = stubPublisher();
    await withEvents({ id: '1' }).commit(publisher);
    assert.equal(emitted.length, 0);
  });
});
