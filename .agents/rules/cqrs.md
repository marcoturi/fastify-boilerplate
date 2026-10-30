---
paths:
  - "src/shared/cqrs/**"
  - "src/modules/**/*.{handler,event-handler,route,resolver,action-creator}.ts"
  - "src/modules/**/domain/**"
  - "doc/CQRS.md"
---

# CQRS

This project uses three buses: `CommandBus`, `QueryBus`, and `EventBus`.

> Full guide with examples: [doc/CQRS.md](../../doc/CQRS.md) (domain events, event error
> isolation and ordered per-key processing are documented there).

## Action creators

Each module has one action creator, built with `actionCreatorFactory` and the module prefix in
`src/modules/<name>/<name>.action-creator.ts`, and re-exported from the module's `index.ts`.
It lives in its own layer-free file so the domain can create events without importing
`index.ts` (which would form a domain ↔ index cycle).

The `Result` type parameter is a phantom type — it exists only at the type level to enable
type-safe `execute()` calls:

```typescript
// src/modules/user/user.action-creator.ts
export const userActionCreator = actionCreatorFactory('user');

// In the handler file — embed both Payload and Result types
export type CreateUserResult = string;
export const createUserCommand = userActionCreator<CreateUserRequestDto, CreateUserResult>('create');
```

## Handler pattern

Every handler follows this structure:

```typescript
export default function doThingHandler({ commandBus, repository, ...deps }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof myCommand>): Promise<MyResult> {
      // business logic here
    },
    init() {
      commandBus.register(myCommand.type, this.handler);
    },
  };
}
```

Key rules:
- Handler parameters use `HandlerAction<typeof creator>` (strips the phantom Result type for register() compatibility)
- The result type (e.g. `CreateUserResult`) is the **unwrapped** value, not `Promise<X>` — the `Promise` wrapper comes from `execute()`
- Events use `userActionCreator<PayloadType>('event-name')` without a Result generic (events return void)
- Handlers are auto-loaded and wired via Awilix DI — the `init()` method is called automatically

## Calling from routes/resolvers

```typescript
// Return type is inferred from the action's phantom Result — no manual generic needed
const id = await fastify.commandBus.execute(createUserCommand(req.body));
```

Do **not** pass a manual generic to `execute()`. The type is inferred from the action creator's `Result` parameter.

## Middlewares

Middlewares use an onion-model pipeline (composed via `reduceRight`). They must **never mutate** the action — always spread into a new object, and return the result of the next handler:

```typescript
function myMiddleware(action: Action<unknown>, handler: CommandHandler): Promise<unknown> {
  const enrichedAction = { ...action, meta: { ...action.meta, foo: 'bar' } } as Action<unknown>;
  return handler(enrichedAction);
}
```

There are separate types for command/query vs event middlewares (in `src/shared/cqrs/bus.types.ts`):
- `CommandMiddleware` — returns `Promise<unknown>` (used by CommandBus and QueryBus)
- `EventMiddleware` — returns `void | Promise<void>` (used by EventBus); return the handler's result so the bus can await it and isolate failures

## Bus differences

| Bus | Purpose | Register method | Dispatch method | Handler return |
|---|---|---|---|---|
| `CommandBus` | State-changing mutations | `register(type, handler)` | `execute(action)` → `Promise<R>` (inferred) | `Promise<unknown>` |
| `QueryBus` | Idempotent reads | `register(type, handler)` | `execute(action)` → `Promise<R>` (inferred) | `Promise<unknown>` |
| `EventBus` | Fire-and-forget notifications | `on(type, handler)` | `emit(action)` | `void \| Promise<void>` |

Commands and queries share a `requestBus` factory in `src/shared/cqrs/request-bus.ts`.
The event bus is a separate implementation in `src/shared/cqrs/event-bus.ts` with a `logger` dependency:
it logs debug-level warnings when events have no subscribers, and isolates and logs failing handlers
instead of rejecting. Note the different API: `on`/`emit` for events vs `register`/`execute` for
commands and queries.

## Adding a new CQRS middleware

1. Define the middleware function in `src/shared/cqrs/middlewares.ts` (or a new file)
2. Match the correct signature: `CommandMiddleware` for command/query buses, `EventMiddleware` for event bus
3. Never mutate the action — spread into a new object
4. Register in `src/shared/cqrs/index.ts` via `busInstance.addMiddleware(myMiddleware)`
5. Middleware order matters: first added = outermost wrapper
