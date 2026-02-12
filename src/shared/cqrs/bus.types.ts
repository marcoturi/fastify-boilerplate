export type Meta = null | Record<string, unknown>;

export interface Action<Payload> {
  type: string;
  payload: Payload;
  meta?: Meta;
}

export interface CommandCreator<Payload> {
  type: string;

  (payload: Payload, meta?: Meta): Action<Payload>;
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
  execute<R>(command: Action<unknown>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

/** QueryBus has the same shape as CommandBus but is semantically distinct:
 *  queries must be idempotent and side-effect-free. */
export interface QueryBus {
  register<P>(type: string, handler: (query: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(query: Action<unknown>): Promise<R>;
  addMiddleware(fn: CommandMiddleware): void;
}

export interface EventBus {
  on<P>(type: string, handler: (event: Action<P>) => void): void;
  emit(event: Action<unknown>): void;
  addMiddleware(fn: EventMiddleware): void;
}
