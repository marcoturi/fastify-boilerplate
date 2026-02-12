import type { Action, EventBus, EventHandler, Middleware } from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares } from '#src/shared/utils/pipe.ts';

export function eventBus(): EventBus {
  const handlers = new Map<string, EventHandler[]>();
  const middlewares: Middleware[] = [];

  function on<P>(type: string, handler: (event: Action<P>) => void): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    const existing = handlers.get(type) ?? [];
    existing.push(handler as EventHandler);
    handlers.set(type, existing);
  }

  function emit(event: Action<unknown>): void {
    if (!event || typeof event !== 'object') {
      throw new TypeError('event must be an object');
    }
    if (typeof event.type !== 'string') {
      throw new TypeError('event.type must be a string');
    }
    const eventHandlers = handlers.get(event.type);
    if (!eventHandlers || eventHandlers.length === 0) {
      return; // Events with no subscribers are silently ignored
    }

    for (const handler of eventHandlers) {
      if (middlewares.length > 0) {
        const composed = composeMiddlewares(middlewares);
        void composed(event, handler);
      } else {
        handler(event);
      }
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
