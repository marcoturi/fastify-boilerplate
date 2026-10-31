import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type { Action, Next } from '#src/shared/cqrs/bus.types.ts';

/** Creates a new action with correlation ID and timestamp injected into meta.
 *  Does NOT mutate the original action. The event bus calls it once per emitted event,
 *  so every subscriber sees the same metadata, stamped when the event was emitted. */
export function withMetadata(action: Action<unknown>): Action<unknown> {
  return {
    ...action,
    meta: {
      ...action.meta,
      correlationId: action.meta?.correlationId ?? getRequestId(),
      timestamp: action.meta?.timestamp ?? Date.now(),
    },
  } as Action<unknown>;
}

/** Metadata middleware for the command/query bus — creates a new action, does not mutate. */
export function decorateCommandWithMetadata(action: Action<unknown>, next: Next): unknown {
  return next(withMetadata(action));
}

export function trackExecutionTimeMiddleware(logger: FastifyBaseLogger) {
  return async function trackExecutionTime(action: Action<unknown>, next: Next): Promise<unknown> {
    const startTime = performance.now();
    try {
      return await next(action);
    } finally {
      // Logged for failing actions too: a slow failure is worth seeing
      const duration = (performance.now() - startTime).toFixed(2);
      logger.debug(`Action ${action.type} took ${duration}ms of execution time.`);
    }
  };
}
