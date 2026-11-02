# CQRS

This project implements **Command Query Responsibility Segregation (CQRS)** with three
in-process buses wired into Fastify via a plugin and Awilix dependency injection.

- **CommandBus** — state-changing operations (request → response).
- **QueryBus** — idempotent, side-effect-free reads (request → response).
- **EventBus** — fire-and-forget notifications (one publisher → many subscribers).

Commands and queries are dispatched with `execute(action)` and return a value; events are
published with `emit(action)` and return nothing. All three are decorated onto the Fastify
instance (`fastify.commandBus`, `fastify.queryBus`, `fastify.eventBus`).

> Source: `src/shared/cqrs/`. Buses are registered by the `fastify-cqrs` plugin in
> `src/shared/cqrs/index.ts`.

---

## Table of contents

- [Building blocks](#building-blocks)
- [Actions and action creators](#actions-and-action-creators)
- [Commands](#commands)
- [Queries](#queries)
- [Events](#events)
  - [Multiple subscribers](#multiple-subscribers)
  - [Async handlers and error isolation](#async-handlers-and-error-isolation)
  - [Ordered, per-key processing](#ordered-per-key-processing)
- [The three buses at a glance](#the-three-buses-at-a-glance)
- [Middlewares](#middlewares)
- [Dependency injection & registration](#dependency-injection--registration)
- [Adding a new command / query / event](#adding-a-new-command--query--event)

---

## Building blocks

```text
Route / Resolver ──execute()──▶ CommandBus / QueryBus ──▶ Handler ──▶ Domain / Repository
                                                             │
                                                             └──emit()──▶ EventBus ──▶ Event handler(s)
```

- An **Action** is a plain object `{ type, payload, meta? }` (`src/shared/cqrs/bus.types.ts`).
- An **action creator** is a typed factory that stamps the `type` and carries a *phantom*
  `Result` type used only at compile time to infer the return of `execute()`.
- A **handler** is a factory `<name>Handler({ deps }: Dependencies)` returning `{ init }`.
  `init()` registers the handler function on the right bus and is called automatically at
  startup.

---

## Actions and action creators

Each module has a prefixed action-creator factory in `<module>.action-creator.ts`, re-exported
from its `index.ts`. It lives in its own file so the domain can create events without importing
`index.ts`, which would form a cycle:

```typescript
// src/modules/user/user.action-creator.ts
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

export const userActionCreator = actionCreatorFactory('user'); // types become "user/<name>"
```

An action creator embeds **both** the payload type and the (phantom) result type:

```typescript
// The result is the unwrapped value — NOT Promise<string>
export const createUserCommand = userActionCreator<CreateUserRequestDto, string>('create');
// createUserCommand.type === 'user/create'

const action = createUserCommand({ email, country, street, postalCode });
// => { type: 'user/create', payload: { ... } }
```

- The `Result` type parameter never exists at runtime; it lets `execute()` infer its return
  type, so you **never** pass a manual generic to `execute()`.
- A creator takes an optional `meta` as second argument (`createUserCommand(payload, meta)`);
  the action has a `meta` only when the call passes one. The buses add the correlation id and
  the timestamp to it.

---

## Commands

A command mutates state and returns a result. The handler registers itself on the
`commandBus` in `init()`.

```typescript
// src/modules/user/commands/create-user/create-user.handler.ts
export const createUserCommand = userActionCreator<CreateUserRequestDto, string>('create');

export default function createUserHandler({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    init() {
      commandBus.register(createUserCommand, async ({ payload }) => {
        const user = userDomain.createUser(payload);
        try {
          await userRepository.insert(user);
        } catch (error: unknown) {
          if (error instanceof AlreadyExistsException) {
            throw new UserAlreadyExistsError(error);
          }
          throw error;
        }
        eventBus.emit(createUserEvent(user)); // only once the write has succeeded (see "Domain events")
        return user.id;
      });
    },
  };
}
```

`register()` types the handler from the creator: the payload is the creator's, and the handler
must resolve to the creator's result (here `string`), so it needs no annotation.

Dispatch from a route — the return type is inferred, no manual generic:

```typescript
// src/modules/user/commands/create-user/create-user.route.ts
handler: async (req, res) => {
  const id = await fastify.commandBus.execute(createUserCommand(req.body)); // id: string
  return res.status(201).send({ id });
};
```

> `execute()` always returns a promise: a type with no handler (`Error: ... is not registered`)
> rejects it like an error thrown inside the handler, so `await` or `.catch()` handles both.

---

## Queries

A query is identical in shape to a command but registers on the `queryBus` and **must be
idempotent / side-effect-free**.

```typescript
// src/modules/user/queries/find-users/find-users.handler.ts
export const findUsersQuery = userActionCreator<FindUsersRequestDto, Paginated<UserEntity>>(
  'find-all-paginated',
);

export default function findUsersHandler({ queryBus, userRepository }: Dependencies) {
  return {
    init() {
      queryBus.register(findUsersQuery, async ({ payload }) => {
        // Pick known fields only: the request schema does not reject extra keys (e.g. orderBy)
        const { limit, page, country, postalCode, street } = payload;
        const query = paginatedQuery({ limit, page });
        return userRepository.findAllPaginatedFiltered(query, { country, postalCode, street });
      });
    },
  };
}
```

```typescript
// in the route/resolver
const result = await fastify.queryBus.execute(findUsersQuery(req.query)); // result: Paginated<UserEntity>
```

---

## Events

Events are **fire-and-forget**: `emit()` returns `void`, and a command handler does not wait
for subscribers. Events are declared with an action creator **without** a `Result` generic
(they return nothing), and subscribers register with `eventBus.on()`.

```typescript
// the event is owned by the domain — src/modules/user/domain/user.events.ts
export const createUserEvent = userActionCreator<UserEntity>('created'); // type: 'user/created'

// a subscriber (any module) reacts to it
eventBus.on(createUserEvent, provisionDefaultSettings);
```

### Domain events

The domain defines its events (`domain/<module>.events.ts`) and the command handler emits them
**after the write succeeds**, so a failed write announces nothing:

```typescript
const user = userDomain.createUser(payload);
await userRepository.insert(user);
eventBus.emit(createUserEvent(user));
```

Delivery is **at most once**. The bus lives in memory: an event is lost if the process dies
between the write and `emit()`, and a failing subscriber is logged, not retried. Fine for
side effects you can afford to miss (a log, a cache refresh). A subscriber that must never miss
an event needs a transactional outbox, which the boilerplate does not ship: the event is
written in the same transaction as the change, and a relay publishes it.

```typescript
// subscriber — src/modules/settings/commands/create-settings/create-settings.event-handler.ts
export default function createSettingsEventHandler({ eventBus, logger }: Dependencies) {
  return {
    init() {
      eventBus.on(createUserEvent, ({ payload }) => {
        // Log only the id: the payload carries personal data (email, address)
        logger.info({ userId: payload.id }, 'Creating default settings for user');
        // ...create default settings for the new user
      });
    },
  };
}
```

If an event is emitted with no subscribers, the bus logs at `debug` and returns — it is not an
error.

### Multiple subscribers

Any number of handlers can subscribe to the same event type; all are invoked.

```typescript
eventBus.on(createUserEvent, sendWelcomeEmail);
eventBus.on(createUserEvent, provisionDefaultSettings);
eventBus.emit(createUserEvent(user)); // both handlers run
```

### Async handlers and error isolation

Handlers may be **synchronous or `async`**. The bus isolates failures: a thrown error or a
rejected promise is caught and logged via the injected logger — it never escapes as an
unhandled rejection, and one failing subscriber does not stop the others.

```typescript
eventBus.on(createUserEvent, async (event) => {
  await mailer.sendWelcome(event.payload.email); // if this rejects, it is logged, not fatal
});
```

### Ordered, per-key processing

By default subscribers run concurrently. Pass a `keyExtractor` to serialize events that share
a key (e.g. the same aggregate id): same-key events are processed **one at a time, in emit
order**, while different keys still run concurrently. This prevents races on the same entity.

```typescript
eventBus.on(
  walletTransactionEvent,
  async (event) => {
    await walletRepository.applyTransaction(event.payload); // must not overlap per wallet
  },
  { keyExtractor: (event) => (event.payload as { walletId: string }).walletId },
);

// These two are processed sequentially (same walletId), in order:
eventBus.emit(walletTransactionEvent({ walletId: 'w1', amount: 10 }));
eventBus.emit(walletTransactionEvent({ walletId: 'w1', amount: -5 }));
// This one runs concurrently (different walletId):
eventBus.emit(walletTransactionEvent({ walletId: 'w2', amount: 3 }));
```

---

## The three buses at a glance

| Bus | Purpose | Subscribe | Dispatch | Handler return |
| --- | --- | --- | --- | --- |
| `CommandBus` | state-changing mutations | `register(creator, handler)` | `execute(action)` → `Promise<R>` (inferred) | `Promise<R>` of the creator |
| `QueryBus` | idempotent reads | `register(creator, handler)` | `execute(action)` → `Promise<R>` (inferred) | `Promise<R>` of the creator |
| `EventBus` | fire-and-forget notifications | `on(creator, handler, options?)` | `emit(action)` → `void` | `void \| Promise<void>` |

A command or query type has exactly one handler: registering a second one for the same type
throws. An event type can have any number of subscribers.

`CommandBus` and `QueryBus` share the `requestBus` factory
(`src/shared/cqrs/request-bus.ts`); the `EventBus` is a separate implementation
(`src/shared/cqrs/event-bus.ts`) with the multi-subscriber, error-isolation and per-key
ordering behavior described above.

---

## Middlewares

Middlewares wrap handlers in an **onion** (composed via `reduceRight` in
`src/shared/cqrs/middlewares.ts`): the **first added is the outermost** wrapper.
They must **never mutate** the action — always spread into a new object.

```typescript
const myMiddleware: Middleware = (action, next) => {
  const enriched = { ...action, meta: { ...action.meta, foo: 'bar' } } as Action<unknown>;
  return next(enriched); // return the result so it propagates
};
```

One `Middleware` type (`src/shared/cqrs/bus.types.ts`) serves the three buses. It must
**return** what `next` returns: commands and queries resolve to the handler's result, and the
event bus awaits it (for per-key ordering) and isolates failures.

Registered in `src/shared/cqrs/index.ts`, outermost first:

```text
command / query :  OTel tracing → trackExecutionTime → handler
event           :  OTel tracing → handler
```

- Before the middlewares, the buses add `correlationId` (from the request context) and
  `timestamp` to `meta`, immutably: `execute()` once per command or query, `emit()` once per
  event, so every subscriber sees the time the event was emitted.
- `tracingMiddleware(bus)` — wraps each dispatch in an OpenTelemetry span named after the
  action type, on all three buses (noop spans when OTel is disabled).
- `trackExecutionTimeMiddleware` — logs execution time per action.

---

## Dependency injection & registration

Handler files are auto-loaded by Awilix, which calls their `init()` at startup: no manual wiring.
How modules declare and receive their dependencies is in the
[modules rule](../.agents/rules/modules.md#dependency-injection).

---

## Adding a new command / query / event

1. **Action creator** — in the handler file, embed the payload and (for command/query) result
   types:

   ```typescript
   export const activateUserCommand = userActionCreator<{ id: string }, void>('activate');
   ```

2. **Handler** — factory returning `{ init }`; register the handler on the right bus in `init()`:

   ```typescript
   export default function activateUserHandler({ userRepository, commandBus }: Dependencies) {
     return {
       init() {
         commandBus.register(activateUserCommand, async ({ payload }) => {
           const user = await userRepository.findOneById(payload.id);
           if (!user) throw new NotFoundException(`User ${payload.id} not found`);
           await userRepository.update({ ...user, /* ...activate */ });
         });
       },
     };
   }
   ```

3. **Dispatch** from a route/resolver — no manual generic:

   ```typescript
   await fastify.commandBus.execute(activateUserCommand({ id: req.params.id }));
   ```

For a **query**, use `queryBus` / `queryBus.register`. For an **event**, drop the `Result`
generic on the creator and subscribe with `eventBus.on(creator, handler, options?)` in an
`*.event-handler.ts` file.

