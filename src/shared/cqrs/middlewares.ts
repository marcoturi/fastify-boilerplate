import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type { Action, Middleware, Next } from '#src/shared/cqrs/bus.types.ts';

/** Creates a new action with correlation ID and timestamp injected into meta.
 *  Does NOT mutate the original action. */
export function withMetadata(action: Action<unknown>): Action<unknown> {
  return {
    ...action,
    meta: {
      ...action.meta,
      correlationId: action.meta?.correlationId ?? getRequestId(),
      timestamp: action.meta?.timestamp ?? Date.now(),
    },
  };
}

/** Wraps the handler in the middlewares and runs the action: the first one is the outermost */
export function composeMiddlewares(middlewares: Middleware[]) {
  return (action: Action<unknown>, handler: Next): unknown =>
    middlewares.reduceRight<Next>(
      (next, middleware) => (a) => middleware(a, next),
      handler,
    )(action);
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
