import type { FastifyBaseLogger } from 'fastify';

export type Meta = null | Record<string, unknown>;

/** Unique symbol used to brand Action objects, preventing plain-object misuse. */
declare const ActionBrand: unique symbol;

/** Phantom symbol carrying the Result type — never set at runtime. */
declare const ResultType: unique symbol;

export interface Action<Payload, Result = unknown> {
  readonly [ActionBrand]: true;
  /** Phantom property — exists only at the type level to carry the Result type. */
  readonly [ResultType]?: Result;
  readonly type: string;
  readonly payload: Payload;
  readonly meta?: Meta;
}

/** Extracts the Result type from an Action. */
export type ActionResult<A> = A extends Action<unknown, infer R> ? R : unknown;

/** Produces an `Action<Payload>` (Result = unknown) from a CommandCreator.
 *  Use this for handler parameter types so they stay compatible with `register()`. */
export type HandlerAction<C> = C extends CommandCreator<infer P, unknown> ? Action<P> : never;

export interface CommandCreator<Payload, Result = unknown> {
  type: string;

  (payload: Payload, meta?: Meta): Action<Payload, Result>;
}

export type CommandHandler = (command: Action<unknown>) => Promise<unknown>;
export type QueryHandler = (query: Action<unknown>) => Promise<unknown>;
/** Event handlers may be sync or async; the bus isolates and logs their failures. */
export type EventHandler = (event: Action<unknown>) => void | Promise<void>;

/** Runs the rest of a middleware chain, ending with the handler. */
export type Next = (action: Action<unknown>) => unknown;

/** Wraps every action of a bus, first added = outermost. It calls `next` with the action, or a
 *  new one (never mutate it), and returns its result: commands and queries resolve to the
 *  handler's result, and the event bus awaits it to keep per-key order and isolate failures. */
export type Middleware = (action: Action<unknown>, next: Next) => unknown;

/** Opt-in ordering for an event subscription: events whose `keyExtractor` returns the
 *  same key are processed one at a time, in emit order (e.g. per aggregate/entity id),
 *  while different keys run concurrently. */
export interface SequentialProcessingOptions {
  keyExtractor: (event: Action<unknown>) => string;
}

/** A bus of commands or queries: one handler per type, whose result `execute` returns. */
export interface RequestBus {
  /** Registers the handler of the creator's actions: it must return the creator's result type.
   *  NoInfer: P and R come from the creator only, else a wrong handler would widen them */
  register<P, R>(
    creator: CommandCreator<P, R>,
    handler: (action: Action<NoInfer<P>>) => Promise<NoInfer<R>>,
  ): void;
  unregister(creator: { type: string }): void;
  execute<R>(action: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: Middleware): void;
}

/** Commands change state. */
export type CommandBus = RequestBus;

/** Queries have the same shape on a separate bus: they must be idempotent and side-effect-free. */
export type QueryBus = RequestBus;

/** Minimal publishing port. Anything that can publish an event satisfies this — the event
 *  bus today, a transactional-outbox writer tomorrow. Consumers (e.g. `DomainResult.commit`)
 *  should depend on this, not on the full `EventBus`. */
export interface EventPublisher {
  emit(event: Action<unknown>): void | Promise<void>;
}

export interface EventBus extends EventPublisher {
  on<P>(
    creator: CommandCreator<P>,
    handler: (event: Action<P>) => void | Promise<void>,
    options?: SequentialProcessingOptions,
  ): void;
  emit(event: Action<unknown>): void;
  addMiddleware(fn: Middleware): void;
  /** Resolves once no handler is running, including the handlers of events emitted meanwhile */
  drain(): Promise<void>;
}

/** Options for creating an event bus instance. */
export interface EventBusOptions {
  logger: FastifyBaseLogger;
}
