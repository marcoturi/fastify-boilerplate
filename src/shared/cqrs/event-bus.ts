import { AsyncLocalStorage } from 'node:async_hooks';
import type {
  Action,
  CommandCreator,
  EventBus,
  EventBusOptions,
  EventHandler,
  Middleware,
  SequentialProcessingOptions,
} from '#src/shared/cqrs/bus.types.ts';
import { composeMiddlewares, withMetadata } from '#src/shared/cqrs/middlewares.ts';

/** A queued event and a snapshot of the async context it was emitted in (request context,
 *  OTel span). The drain loop runs the event inside that snapshot: otherwise it would inherit
 *  the context of whichever request started the drain. */
interface QueuedEvent {
  event: Action<unknown>;
  runInEmitContext: <R>(fn: () => R) => R;
}

/** One subscription for an event type. When `keyExtractor` is set, events are queued
 *  per key and drained one at a time (ordered per key, concurrent across keys): a key has a
 *  queue exactly while its drain loop runs. */
interface HandlerRegistration {
  handler: EventHandler;
  keyExtractor?: SequentialProcessingOptions['keyExtractor'];
  queues: Map<string, QueuedEvent[]>;
}

export function eventBus({ logger }: EventBusOptions): EventBus {
  const handlers = new Map<string, HandlerRegistration[]>();
  const middlewares: Middleware[] = [];
  // Async handlers still running, so drain() can wait for them (e.g. before the DB closes).
  // Only promises that never reject go in: their failures are already logged.
  const running = new Set<Promise<unknown>>();

  function track(promise: Promise<unknown>): void {
    running.add(promise);
    void promise.finally(() => running.delete(promise));
  }

  function logHandlerError(event: Action<unknown>, error: unknown): void {
    logger.error(
      { err: error instanceof Error ? error : new Error(String(error)), eventType: event.type },
      `Event handler for "${event.type}" failed`,
    );
  }

  /** Runs the handler through the middleware chain; result may be sync or a Promise. */
  function executeChain(event: Action<unknown>, handler: EventHandler): unknown {
    return composeMiddlewares(middlewares)(event, handler);
  }

  /** Fire-and-forget dispatch that never lets a handler failure escape as an
   *  unhandled rejection — sync throws and async rejections are logged. */
  function runIsolated(event: Action<unknown>, handler: EventHandler): void {
    try {
      const result = executeChain(event, handler);
      if (result instanceof Promise) {
        track(result.catch((error) => logHandlerError(event, error)));
      }
    } catch (error) {
      logHandlerError(event, error);
    }
  }

  async function drainQueue(registration: HandlerRegistration, key: string): Promise<void> {
    try {
      // Re-reads the queue each iteration so events emitted while awaiting are included.
      for (
        let queued = registration.queues.get(key)?.shift();
        queued !== undefined;
        queued = registration.queues.get(key)?.shift()
      ) {
        const { event, runInEmitContext } = queued;
        await runInEmitContext(async () => {
          try {
            await executeChain(event, registration.handler);
          } catch (error) {
            logHandlerError(event, error);
          }
        });
      }
    } finally {
      registration.queues.delete(key);
    }
  }

  function enqueueSequential(
    event: Action<unknown>,
    registration: HandlerRegistration,
    key: string,
  ): void {
    const queued = { event, runInEmitContext: AsyncLocalStorage.snapshot() };
    const queue = registration.queues.get(key);
    if (queue) {
      queue.push(queued); // the running drain loop picks it up
      return;
    }
    registration.queues.set(key, [queued]);
    track(drainQueue(registration, key));
  }

  function on<P>(
    creator: CommandCreator<P>,
    handler: (event: Action<P>) => void | Promise<void>,
    options?: SequentialProcessingOptions,
  ): void {
    const existing = handlers.get(creator.type) ?? [];
    existing.push({
      handler: handler as EventHandler,
      keyExtractor: options?.keyExtractor,
      queues: new Map(),
    });
    handlers.set(creator.type, existing);
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
    const registrations = handlers.get(event.type);
    if (!registrations || registrations.length === 0) {
      logger.debug(`No handlers registered for event "${event.type}"`);
      return;
    }
    // Stamped here, not in a middleware: a middleware runs per subscriber, and a queued
    // event only when its turn comes, so each would see a different timestamp
    const stamped = withMetadata(event);
    for (const registration of registrations) {
      dispatch(stamped, registration);
    }
  }

  function addMiddleware(fn: Middleware) {
    middlewares.push(fn);
  }

  async function drain(): Promise<void> {
    // A handler can emit more events while it runs: wait again until none is left
    while (running.size > 0) {
      await Promise.all(running);
    }
  }

  return {
    on,
    emit,
    addMiddleware,
    drain,
  };
}
