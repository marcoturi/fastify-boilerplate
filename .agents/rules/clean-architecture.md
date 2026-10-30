---
paths:
  - "src/modules/**/*.{handler,event-handler,service,domain,repository,mapper}.ts"
  - "src/modules/**/domain/**"
---

# Clean architecture

Each layer has one job. Logic in the wrong layer is a smell, even when it works.

| Layer | Files | Does | Must not |
|---|---|---|---|
| Transport | `*.route.ts`, `*.resolver.ts` | Validate input, dispatch one action, shape the response | Contain business logic |
| Handler | `*.handler.ts`, `*.event-handler.ts` | Take the action, call a few domain, service or repository functions, return the result or emit events | Loop over items making business decisions, orchestrate many steps |
| Service | `*.service.ts` | Orchestrate: read from repositories, ask the domain for decisions, write, emit events | Decide: no status checks, thresholds, aggregations or rule-based conditions |
| Domain | `domain/*.domain.ts` | Pure decisions and computations: evaluate, compute, aggregate, transform; it may record events with `withEvents` | Call repositories, emit events, do any I/O |
| Repository | `database/*.repository.ts` | Data access (SQL) and mapper delegation | Business logic or orchestration |

**Litmus test:** "Does this function make a decision or compute a value?" → domain. "Does it read
or write data, or trigger a side effect?" → service, or repository for plain data access.

## Services

There are no services yet: add one (`<name>.service.ts`, auto-loaded by DI like repositories) when

- a handler orchestrates several steps (read, decide, write, notify), or
- two handlers need the same orchestration.

If a handler calls one domain function and returns, a service adds nothing: skip it.

## When to split a file

Size is a signal, not a rule: the goal is cohesion.

- **Handler over ~100 lines of logic** (excluding imports, types and the action creator): move
  the orchestration into a service and leave the handler as a thin call to it.
- **Domain or service over ~400 lines**: split it if it holds groups of functions that serve
  different purposes and share no private state. Keep it together if the functions collaborate
  on one problem or share closures, maps or caches.
- **Smell test:** if you cannot describe the file in one sentence without "and", it holds two concerns.

## Factory functions

No classes except errors. Handlers, services, domains, repositories and mappers are factory
functions that return an object:

```typescript
// user-activation.service.ts → `userActivationService` in the container
export default function userActivationService({ userRepository, userDomain, eventBus }: Dependencies) {
  // Private helpers are inner closures
  const notFound = (id: string) => new NotFoundException(`User ${id} not found`);

  async function activate(id: string) {
    const user = await userRepository.findOneById(id);
    if (!user) throw notFound(id);
    const activated = userDomain.activate(user); // decision: the domain returns entity + events
    await userRepository.update(activated.entity);
    await activated.commit(eventBus); // publish recorded events after the write succeeds
  }

  return { activate };
}
```

- **Name:** the camelCase key Awilix derives from the file name (`create-user.handler.ts` →
  `createUserHandler`, `user.repository.ts` → `userRepository`), so searching for a dependency
  finds its factory. No `make` or `create` prefix. Factories outside the container are named
  after what they produce (`requestBus`, `tracingMiddleware`).
- **Parameter:** one destructured `Dependencies` object, or none when the factory needs nothing
  (e.g. a pure domain).
- **Return type:** inferred. Annotate it only when the factory implements an interface, so
  TypeScript checks the implementation against it: a repository port
  (`userRepository(...): UserRepository`), `Mapper<...>`, a bus type.
- **Exports:** every function lives inside the factory, public ones on the returned object and
  private helpers as inner closures. Besides the default-exported factory, a file exports only
  types, schemas and, in handler files, the action creator: never standalone functions.
