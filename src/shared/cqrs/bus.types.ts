import type { FastifyBaseLogger } from 'fastify';

export type Meta = Record<string, unknown>;

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

/** Makes the actions of one type (commands, queries and events alike) and carries that type */
export interface ActionCreator<Payload, Result = unknown> {
  type: string;

  (payload: Payload, meta?: Meta): Action<Payload, Result>;
}

export type CommandHandler = (command: Action<unknown>) => Promise<unknown>;
/** Event handlers may be sync or async; the bus isolates and logs their failures. */
export type EventHandler = (event: Action<unknown>) => void | Promise<void>;

/** Runs the rest of a middleware chain, ending with the handler. */
export type Next = (action: Action<unknown>) => unknown;

/** Wraps every action of a bus: what it must do is in .agents/rules/cqrs.md (Middlewares) */
export type Middleware = (action: Action<unknown>, next: Next) => unknown;

/** Opt-in ordering for an event subscription: events whose `keyExtractor` returns the
 *  same key are processed one at a time, in emit order (e.g. per aggregate/entity id),
 *  while different keys run concurrently. */
export interface SequentialProcessingOptions<P = unknown> {
  keyExtractor: (event: Action<P>) => string;
}

/** A bus of commands or queries: one handler per type, whose result `execute` returns. */
export interface RequestBus {
  /** Registers the handler of the creator's actions: it must return the creator's result type.
   *  NoInfer: P and R come from the creator only, else a wrong handler would widen them */
  register<P, R>(
    creator: ActionCreator<P, R>,
    handler: (action: Action<NoInfer<P>>) => Promise<NoInfer<R>>,
  ): void;
  execute<R>(action: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: Middleware): void;
}

/** Commands change state. */
export type CommandBus = RequestBus;

/** Queries have the same shape on a separate bus: they must be idempotent and side-effect-free. */
export type QueryBus = RequestBus;

/** Events have no result (`Result` is `void`): a command or a query with a result is rejected
 *  at compile time */
export interface EventBus {
  on<P>(
    creator: ActionCreator<P, void>,
    handler: (event: Action<P, void>) => void | Promise<void>,
    options?: SequentialProcessingOptions<P>,
  ): void;
  emit(event: Action<unknown, void>): void;
  addMiddleware(fn: Middleware): void;
  /** Resolves once no handler is running, including the handlers of events emitted meanwhile */
  drain(): Promise<void>;
}

/** Options for creating an event bus instance. */
export interface EventBusOptions {
  logger: FastifyBaseLogger;
}
