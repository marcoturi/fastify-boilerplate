import type {
  Action,
  EventBus,
  EventBusOptions,
  EventHandler,
  EventMiddleware,
  SequentialProcessingOptions,
} from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares } from '#src/shared/utils/compose-middlewares.ts';

/** One subscription for an event type. When `keyExtractor` is set, events are queued
 *  per key and drained one at a time (ordered per key, concurrent across keys). */
interface HandlerRegistration {
  handler: EventHandler;
  keyExtractor?: SequentialProcessingOptions['keyExtractor'];
  queues: Map<string, Action<unknown>[]>;
  processing: Set<string>;
}

export function eventBus({ logger }: EventBusOptions): EventBus {
  const handlers = new Map<string, HandlerRegistration[]>();
  const middlewares: EventMiddleware[] = [];

  function logHandlerError(event: Action<unknown>, error: unknown): void {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)), eventType: event.type },
      `Event handler for "${event.type}" failed`,
    );
  }

  /** Runs the handler through the middleware chain; result may be sync or a Promise. */
  function executeChain(event: Action<unknown>, handler: EventHandler): unknown {
    if (middlewares.length > 0) {
      return composeMiddlewares(middlewares)(event, handler);
    }
    return handler(event);
  }

  /** Fire-and-forget dispatch that never lets a handler failure escape as an
   *  unhandled rejection — sync throws and async rejections are logged. */
  function runIsolated(event: Action<unknown>, handler: EventHandler): void {
    try {
      const result = executeChain(event, handler);
      if (result instanceof Promise) {
        result.catch((error) => logHandlerError(event, error));
      }
    } catch (error) {
      logHandlerError(event, error);
    }
  }

  async function drainQueue(registration: HandlerRegistration, key: string): Promise<void> {
    registration.processing.add(key);
    try {
      // Re-reads the queue each iteration so events emitted while awaiting are included.
      for (
        let event = registration.queues.get(key)?.shift();
        event !== undefined;
        event = registration.queues.get(key)?.shift()
      ) {
        try {
          await executeChain(event, registration.handler);
        } catch (error) {
          logHandlerError(event, error);
        }
      }
    } finally {
      registration.processing.delete(key);
      registration.queues.delete(key);
    }
  }

  function enqueueSequential(
    event: Action<unknown>,
    registration: HandlerRegistration,
    key: string,
  ): void {
    const queue = registration.queues.get(key) ?? [];
    queue.push(event);
    registration.queues.set(key, queue);
    if (!registration.processing.has(key)) {
      void drainQueue(registration, key);
    }
  }

  function on<P>(
    type: string,
    handler: (event: Action<P>) => void | Promise<void>,
    options?: SequentialProcessingOptions,
  ): void {
    if (typeof type !== 'string') {
      throw new TypeError('type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('handler must be a function');
    }
    const existing = handlers.get(type) ?? [];
    existing.push({
      handler: handler as EventHandler,
      keyExtractor: options?.keyExtractor,
      queues: new Map(),
      processing: new Set(),
    });
    handlers.set(type, existing);
  }

  function dispatch(event: Action<unknown>, registration: HandlerRegistration): void {
    const { keyExtractor } = registration;
    if (!keyExtractor) {
      runIsolated(event, registration.handler);
      return;
    }
    let key: string;
    try {
      key = keyExtractor(event);
    } catch (error) {
      logHandlerError(event, error);
      return;
    }
    enqueueSequential(event, registration, key);
  }

  function emit(event: Action<unknown>): void {
    if (!event || typeof event !== 'object') {
      throw new TypeError('event must be an object');
    }
    if (typeof event.type !== 'string') {
      throw new TypeError('event.type must be a string');
    }
    const registrations = handlers.get(event.type);
    if (!registrations || registrations.length === 0) {
      logger.debug(`No handlers registered for event "${event.type}"`);
      return;
    }
    for (const registration of registrations) {
      dispatch(event, registration);
    }
  }

  function addMiddleware(fn: EventMiddleware) {
    middlewares.push(fn);
  }

  return {
    on,
    emit,
    addMiddleware,
  };
}
