import type {
  Action,
  CommandBus,
  CommandHandler,
  CommandMiddleware,
} from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares } from '#src/shared/utils/compose-middlewares.ts';

export function commandBus(): CommandBus {
  const handlers = new Map<string, CommandHandler>();
  const middlewares: CommandMiddleware[] = [];

  function register<P>(type: string, handler: (command: Action<P>) => Promise<unknown>): void {
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

  function execute<R>(command: Action<unknown>): Promise<R> {
    if (!command || typeof command !== 'object') {
      throw new TypeError('command must be an object');
    }
    if (typeof command.type !== 'string') {
      throw new TypeError('command.type must be a string');
    }
    const handler = handlers.get(command.type);
    if (!handler) {
      throw new Error(`Command type of ${command.type} is not registered`);
    }
    if (middlewares.length > 0) {
      return composeMiddlewares(middlewares)(command, handler) as Promise<R>;
    }
    return handler(command) as Promise<R>;
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
