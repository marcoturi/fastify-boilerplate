import {
  CommandBus,
  Action,
  CommandHandler,
  Middleware,
} from '@/shared/cqrs/bus.types';
import { pipe } from 'ramda';

export function commandBus(): CommandBus {
  const handlers = new Map<string, CommandHandler>();
  const middlewares: Middleware[] = [];

  function register<T extends string = string>(
    type: T,
    handler: CommandHandler,
  ): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    handlers.set(type, handler);
  }

  function unregister<T extends string = string>(type: T): void {
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
      const list = (pipe as any)(...middlewares);
      return list(command, handler);
    } else {
      return handler(command);
    }
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
