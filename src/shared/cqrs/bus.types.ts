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
export type EventHandler = (event: Action<unknown>) => void;

/** Middleware for command/query buses — wraps a handler that returns a Promise. */
export type CommandMiddleware = (
  action: Action<unknown>,
  handler: CommandHandler,
) => Promise<unknown>;

/** Middleware for the event bus — wraps a handler that returns void. */
export type EventMiddleware = (action: Action<unknown>, handler: EventHandler) => void;

export interface CommandBus {
  register<P>(type: string, handler: (command: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(command: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

/** QueryBus is semantically distinct from CommandBus:
 *  queries must be idempotent and side-effect-free. */
export interface QueryBus {
  register<P>(type: string, handler: (query: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(query: Action<unknown, R>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

export interface EventBus {
  on<P>(type: string, handler: (event: Action<P>) => void): void;
  emit(event: Action<unknown>): void;
  addMiddleware(fn: EventMiddleware): void;
}

/** Options for creating an event bus instance. */
export interface EventBusOptions {
  logger: FastifyBaseLogger;
}
