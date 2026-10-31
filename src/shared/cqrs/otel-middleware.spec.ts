import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { type SpanStatus, SpanStatusCode, type TracerProvider, trace } from '@opentelemetry/api';
import type { Action } from './bus.types.ts';
import { traceEventMiddleware, tracingMiddleware } from './otel-middleware.ts';

/** What the middleware did to a span: enough to check it without the OpenTelemetry SDK */
interface RecordedSpan {
  name: string;
  attributes: Record<string, unknown>;
  status?: SpanStatus;
  exceptions: unknown[];
  ended: boolean;
}

const spans: RecordedSpan[] = [];

// The middleware's tracer is a proxy that delegates to the global provider, so registering
// this fake one, even after the module is loaded, captures its spans
const fakeProvider = {
  getTracer: () => ({
    startActiveSpan: (
      name: string,
      options: { attributes: Record<string, unknown> },
      fn: (span: unknown) => unknown,
    ) => {
      const recorded: RecordedSpan = {
        name,
        attributes: { ...options.attributes },
        exceptions: [],
        ended: false,
      };
      spans.push(recorded);
      return fn({
        setAttribute: (key: string, value: unknown) => {
          recorded.attributes[key] = value;
        },
        setStatus: (status: SpanStatus) => {
          recorded.status = status;
        },
        recordException: (exception: unknown) => {
          recorded.exceptions.push(exception);
        },
        end: () => {
          recorded.ended = true;
        },
      });
    },
  }),
} as unknown as TracerProvider;

const action = {
  type: 'user/create',
  payload: {},
  meta: { correlationId: 'req-1' },
} as unknown as Action<unknown>;

describe('OpenTelemetry middlewares', () => {
  before(() => {
    trace.setGlobalTracerProvider(fakeProvider);
  });

  after(() => {
    trace.disable();
  });

  beforeEach(() => {
    spans.length = 0;
  });

  describe('tracingMiddleware()', () => {
    it('wraps the action in a span named after it, with the bus and correlation id', async () => {
      const result = await tracingMiddleware('command')(action, async () => 42);
      assert.equal(result, 42);
      const [span] = spans;
      assert.equal(span?.name, 'user/create');
      assert.deepEqual(span?.attributes, {
        'cqrs.bus': 'command',
        'cqrs.action': 'user/create',
        'cqrs.correlation_id': 'req-1',
      });
      assert.equal(span?.status?.code, SpanStatusCode.OK);
      assert.equal(span?.ended, true);
    });

    it('marks the span as failed, records the exception and rethrows', async () => {
      const failing = async () => {
        throw new Error('boom');
      };
      await assert.rejects(tracingMiddleware('query')(action, failing), /boom/);
      const [span] = spans;
      assert.deepEqual(span?.status, { code: SpanStatusCode.ERROR, message: 'boom' });
      assert.equal(span?.exceptions.length, 1);
      assert.equal(span?.ended, true);
    });
  });

  describe('traceEventMiddleware()', () => {
    it('wraps the event handler in a span on the event bus', async () => {
      await traceEventMiddleware(action, () => undefined);
      const [span] = spans;
      assert.equal(span?.attributes['cqrs.bus'], 'event');
      assert.equal(span?.status?.code, SpanStatusCode.OK);
      assert.equal(span?.ended, true);
    });

    it('records a failing handler and rethrows, so the bus can log it', async () => {
      const failing = () => {
        throw new Error('boom');
      };
      await assert.rejects(async () => traceEventMiddleware(action, failing), /boom/);
      assert.equal(spans[0]?.status?.code, SpanStatusCode.ERROR);
      assert.equal(spans[0]?.ended, true);
    });
  });
});
