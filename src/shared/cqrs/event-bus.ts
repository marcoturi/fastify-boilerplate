import type { Action, EventBus, EventHandler, Middleware } from '#src/shared/cqrs/bus.types.ts';
import { pipe } from '#src/shared/utils/pipe.ts';

export function eventBus(): EventBus {
  const handlers = new Map<string, EventHandler>();
  const middlewares: Middleware[] = [];

  function on<T extends string = string>(type: T, handler: EventHandler): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    handlers.set(type, handler);
  }

  function emit(event: Action<unknown>): void {
    if (!event || typeof event !== 'object') {
      throw new TypeError('event must be an object');
    }
    if (typeof event.type !== 'string') {
      throw new TypeError('event.type must be a string');
    }
    const handler = handlers.get(event.type);
    if (!handler) {
      throw new Error(`Event type of ${event.type} is not registered`);
    }

    if (middlewares.length > 0) {
      const list = pipe(...middlewares);
      list(event, handler);
    } else {
      handler(event);
    }
  }

  function addMiddleware(fn: Middleware) {
    middlewares.push(fn);
  }

  return {
    on,
    emit,
    addMiddleware,
  };
}
