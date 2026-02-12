import type { Action, CommandHandler, CommandMiddleware } from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares } from '#src/shared/utils/compose-middlewares.ts';

export interface RequestBus {
  register<P>(type: string, handler: (action: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(action: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

/**
 * Shared factory for command and query buses.
 * The `label` parameter is used in error messages to distinguish between the two
 * (e.g. "Command type of X is not registered" vs "Query type of X is not registered").
 */
export function createRequestBus(label: string): RequestBus {
  const handlers = new Map<string, CommandHandler>();
  const middlewares: CommandMiddleware[] = [];

  function register<P>(type: string, handler: (action: Action<P>) => Promise<unknown>): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    handlers.set(type, handler as CommandHandler);
  }

  function unregister(type: string): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    handlers.delete(type);
  }

  function execute<R>(action: Action<unknown, R>): Promise<R> {
    if (!action || typeof action !== 'object') {
      throw new TypeError(`${label} must be an object`);
    }
    if (typeof action.type !== 'string') {
      throw new TypeError(`${label}.type must be a string`);
    }
    const handler = handlers.get(action.type);
    if (!handler) {
      throw new Error(`${label} type of ${action.type} is not registered`);
    }
    if (middlewares.length > 0) {
      return composeMiddlewares(middlewares)(action, handler) as Promise<R>;
    }
    return handler(action) as Promise<R>;
  }

  function addMiddleware(fn: CommandMiddleware) {
    middlewares.push(fn);
  }

  return {
    register,
    unregister,
    execute,
    addMiddleware,
  };
}
