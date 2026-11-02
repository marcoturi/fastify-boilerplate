import { type Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import type { Middleware } from '#src/shared/cqrs/bus.types.ts';

const tracer = trace.getTracer('cqrs');

/**
 * Creates the tracing middleware of a bus: each action runs in an OTel span named after its
 * type, which also covers an async event handler, so the event bus awaits it. A failure is
 * recorded on the span and rethrown, for the caller or the event bus to handle.
 * When OTel is disabled the API returns noop spans — zero overhead.
 */
export function tracingMiddleware(bus: 'command' | 'query' | 'event'): Middleware {
  /** Marks the span as failed, with the error message, and records the exception on it. */
  function recordFailure(span: Span, error: unknown): void {
    const exception = error instanceof Error ? error : new Error(String(error));
    span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message });
    span.recordException(exception);
  }

  return (action, next) =>
    tracer.startActiveSpan(
      action.type,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'cqrs.bus': bus,
          'cqrs.action': action.type,
        },
      },
      async (span) => {
        if (action.meta?.correlationId) {
          span.setAttribute('cqrs.correlation_id', String(action.meta.correlationId));
        }
        try {
          const result = await next(action);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          recordFailure(span, error);
          throw error;
        } finally {
          span.end();
        }
      },
    );
}
