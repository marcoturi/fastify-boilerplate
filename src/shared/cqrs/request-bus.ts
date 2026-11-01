import type {
  Action,
  CommandCreator,
  CommandHandler,
  Middleware,
  RequestBus,
} from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares, withMetadata } from '#src/shared/cqrs/middlewares.ts';

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
    const { type } = creator;
    // A command or query has exactly one handler: a second one is a wiring mistake (e.g. two
    // slices using the same type), which replacing the first would hide
    if (handlers.has(type)) {
      throw new Error(`${label} type of ${type} is already registered`);
    }
    handlers.set(type, handler as CommandHandler);
  }

  // async, so a missing handler rejects like a handler error does
  async function execute<R>(action: Action<unknown, R>): Promise<R> {
    const handler = handlers.get(action.type);
    if (!handler) {
      throw new Error(`${label} type of ${action.type} is not registered`);
    }
    return composeMiddlewares(middlewares)(withMetadata(action), handler) as Promise<R>;
  }

  function addMiddleware(fn: Middleware) {
    middlewares.push(fn);
  }

  return {
    register,
    execute,
    addMiddleware,
  };
}
