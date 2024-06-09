export type Meta = null | Record<string, any>;

export interface Action<Payload> {
  type: string;
  payload: Payload;
  meta?: Meta;
}

export interface CommandCreator<Payload> {
  type: string;

  (payload: Payload, meta?: Meta): Action<Payload>;
}

export type CommandHandler = (command: Action<any>) => Promise<any>;
export type EventHandler = (event: Action<any>) => void;

export interface CommandBus {
  register(type: string, handler: CommandHandler): void;
  unregister(type: string): void;
  execute<R>(command: Action<any>): Promise<R>;
  addMiddleware(fn: Middleware): void;
}

export interface EventBus {
  on(type: string, handler: EventHandler): void;
  emit(event: Action<any>): void;
  addMiddleware(fn: Middleware): void;
}

export type Middleware = (
  action: Action<unknown>,
  handler: CommandHandler | EventHandler,
) => Promise<CommandHandler | EventHandler>;
