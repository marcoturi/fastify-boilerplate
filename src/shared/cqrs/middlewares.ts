import type { FastifyBaseLogger } from 'fastify';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type { Action, CommandHandler, EventHandler } from '#src/shared/cqrs/bus.types.ts';

/** Creates a new action with correlation ID and timestamp injected into meta.
 *  Does NOT mutate the original action. */
function withMetadata(action: Action<unknown>): Action<unknown> {
  return {
    ...action,
    meta: {
      ...action.meta,
      correlationId: action.meta?.correlationId ?? getRequestId(),
      timestamp: action.meta?.timestamp ?? Date.now(),
    },
  } as Action<unknown>;
}

/** Metadata middleware for the event bus — creates a new action, does not mutate. */
export function decorateEventWithMetadata(action: Action<unknown>, handler: EventHandler): void {
  handler(withMetadata(action));
}

/** Metadata middleware for the command/query bus — creates a new action, does not mutate. */
export async function decorateCommandWithMetadata(
  action: Action<unknown>,
  handler: CommandHandler,
): Promise<unknown> {
  return handler(withMetadata(action));
}

export function makeTrackExecutionTime(logger: FastifyBaseLogger) {
  return async function trackExecutionTime(
    action: Action<unknown>,
    handler: CommandHandler,
  ): Promise<unknown> {
    const startTime = performance.now();
    const result = await handler(action);
    const endTime = performance.now();
    logger.info(
      `Action ${action.type} took ${(endTime - startTime).toFixed(2)}ms of execution time.`,
    );
    return result;
  };
}
