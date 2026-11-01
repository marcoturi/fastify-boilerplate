import type {
  Action,
  CommandCreator,
  CommandHandler,
  Middleware,
  RequestBus,
} from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares } from '#src/shared/utils/compose-middlewares.ts';

/**
 * Shared factory for command and query buses.
 * The `label` parameter is used in error messages to distinguish between the two
 * (e.g. "Command type of X is not registered" vs "Query type of X is not registered").
 */
export function requestBus(label: string): RequestBus {
  const handlers = new Map<string, CommandHandler>();
  const middlewares: Middleware[] = [];

  function register<P, R>(
    creator: CommandCreator<P, R>,
    handler: (action: Action<NoInfer<P>>) => Promise<NoInfer<R>>,
  ): void {
    const type = creator?.type;
    if (typeof type !== 'string') {
      throw new TypeError('creator.type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    // A command or query has exactly one handler: a second one is a wiring mistake (e.g. two
    // slices using the same type), which replacing the first would hide
    if (handlers.has(type)) {
      throw new Error(`${label} type of ${type} is already registered`);
    }
    handlers.set(type, handler as CommandHandler);
  }

  function unregister(creator: { type: string }): void {
    if (typeof creator?.type !== 'string') {
      throw new TypeError('creator.type must be a string');
    }
    handlers.delete(creator.type);
  }

  // async, so validation and registration errors reject like handler errors do
  async function execute<R>(action: Action<unknown, R>): Promise<R> {
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
    return composeMiddlewares(middlewares)(action, handler) as Promise<R>;
  }

  function addMiddleware(fn: Middleware) {
    middlewares.push(fn);
  }

  return {
    register,
    unregister,
    execute,
    addMiddleware,
  };
}
