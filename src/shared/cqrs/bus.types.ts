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
export type EventHandler = (event: Action<unknown>) => void;

export interface CommandBus {
  register<P>(type: string, handler: (command: Action<P>) => Promise<unknown>): void;
  unregister(type: string): void;
  execute<R>(command: Action<unknown>): Promise<R>;
  addMiddleware(fn: Middleware): void;
}

export interface EventBus {
  on<P>(type: string, handler: (event: Action<P>) => void): void;
  emit(event: Action<unknown>): void;
  addMiddleware(fn: Middleware): void;
}

export type Middleware = (
  action: Action<unknown>,
  handler: CommandHandler | EventHandler,
) => Promise<unknown>;
