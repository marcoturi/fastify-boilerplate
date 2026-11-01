---
paths:
  - "src/shared/cqrs/**"
  - "src/modules/**/*.{handler,event-handler,route,resolver,action-creator}.ts"
  - "src/modules/**/domain/**"
  - "doc/CQRS.md"
---

# CQRS

Three in-process buses: `CommandBus`, `QueryBus` and `EventBus`. The examples, the comparison of
the buses and the middleware order are in the guide, [doc/CQRS.md](../../doc/CQRS.md): this file
holds the rules.

## Action creators

- One per module, built with `actionCreatorFactory('<module>')` in
  `src/modules/<name>/<name>.action-creator.ts` and re-exported from the module's `index.ts`. It
  lives in its own layer-free file so the domain can create events without importing `index.ts`
  (which would form a domain ↔ index cycle)
- A command or query creator embeds the payload and the **unwrapped** result type
  (`userActionCreator<CreateUserRequestDto, string>('create')`), never `Promise<X>`; an event
  creator has no result type
- Never pass a manual generic to `execute()`: the result type is inferred from the creator

## Handlers

- A handler file default-exports a factory that returns `{ init }`: `init()` registers the
  handler inline, with `commandBus.register(creator, handler)` (or `queryBus`) or
  `eventBus.on(creator, handler, options?)`. DI calls it at startup
- `register()` and `on()` type the handler from the creator: no annotations on it
- Helpers are functions in the factory's closure (at module level when they need no dependency),
  never methods of the returned object: the bus calls the handler detached from it, and DI reads
  only `init`. Logic that deserves its own tests, or that several handlers share, goes in the
  domain or in a service
- A command or query type has exactly one handler (a second `register()` throws); an event type
  can have any number of subscribers

## Events

- A failing subscriber is logged, never rethrown, and does not stop the others. Delivery is at
  most once: read the guide before relying on an event
- Subscribers run concurrently: pass `{ keyExtractor }` to `on()` to process the events with the
  same key one at a time, in emit order
- On shutdown the server awaits `eventBus.drain()` before it closes the DB connection

## Middlewares

- Typed as `Middleware` (`src/shared/cqrs/bus.types.ts`), one type for the three buses
- Never mutate the action: spread it into a new one. Always return what `next` returns: the event
  bus awaits it to keep per-key order and isolate failures
- Registered in `src/shared/cqrs/index.ts`: the first added is the outermost
