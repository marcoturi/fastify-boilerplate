import { getRequestId } from '#src/shared/app/app-request-context.ts';
import type { Action, CommandHandler, EventHandler } from '#src/shared/cqrs/bus.types.ts';
import type { FastifyBaseLogger } from 'fastify';

export function decorateWithMetadata(
  action: Action<unknown>,
  handler: CommandHandler | EventHandler,
) {
  action.meta = {
    ...action.meta,
    correlationId: action.meta?.correlationId ?? getRequestId(),
    timestamp: action.meta?.timestamp ?? Date.now(),
  };
  return handler(action) as Promise<CommandHandler | EventHandler>;
}

export function makeTrackExecutionTime(logger: FastifyBaseLogger) {
  return async function trackExecutionTime(
    action: Action<unknown>,
    handler: CommandHandler | EventHandler,
  ) {
    const startTime = performance.now();
    const result = await handler(action);
    const endTime = performance.now();
    logger.info(
      `Action ${action.type} took ${(endTime - startTime).toFixed(2)}ms of execution time.`,
    );
    return result;
  };
}
