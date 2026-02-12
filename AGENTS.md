# AGENTS.md

> Instructions for AI coding assistants (Cursor, Claude Code, GitHub Copilot, etc.)

## Project overview

A production-ready Fastify 5 boilerplate using Clean Architecture, CQRS, DDD, and functional programming.
TypeScript strict mode, ESM-only, Node >= 24 (native TS execution, no build step).

## Quick reference

| What | Where |
|---|---|
| Package manager | `pnpm` (never npm or yarn) |
| Linter + formatter | Biome (never ESLint or Prettier) |
| Validation after changes | `pnpm check` (runs `biome lint && biome format && tsc --noEmit`) |
| Auto-fix formatting | `pnpm format` |
| Unit tests | `pnpm test:unit` (node:test) |
| E2E tests | `pnpm test:e2e` (Cucumber + Gherkin) |
| Architecture validation | `pnpm deps:validate` (dependency-cruiser) |
| DB migrations | `pnpm db:migrate` (DBMate) |

Always run `pnpm check` after making changes. If formatting fails, run `pnpm format` first, then `pnpm check`.

## Architecture

### Layer boundaries (CRITICAL)

The dependency flow is strictly **inward**: `Route → Handler → Domain → Repository`.

```
src/
├── modules/         ← Feature code (vertical slices)
│   └── <feature>/
│       ├── commands/ ← State-changing operations
│       ├── queries/  ← Data-retrieval operations (idempotent)
│       ├── database/ ← Repository port (interface) + adapter (implementation)
│       ├── domain/   ← Business logic, types, errors
│       └── dtos/     ← Shared response schemas
├── server/          ← Fastify setup, plugins, DI wiring
└── shared/          ← Cross-cutting: CQRS, DB, exceptions, utils
```

**Never** import from `src/shared/db/` or `database/` inside handler files.
Handlers interact with data exclusively through repository ports (interfaces).
SQL belongs in repository files only.

### Module independence

Modules should avoid importing directly from other modules. Cross-module communication
uses the CQRS buses:
- Commands/queries for request-response
- Events for fire-and-forget notifications

## CQRS pattern

This project uses three buses: `CommandBus`, `QueryBus`, and `EventBus`.

### Action creators

Actions are created via `actionCreatorFactory` with a module prefix.
The `Result` type parameter is a phantom type — it exists only at the type level
to enable type-safe `execute()` calls:

```typescript
// In the module's index.ts
export const userActionCreator = actionCreatorFactory('user');

// In the handler file — embed both Payload and Result types
export type CreateUserResult = string;
export const createUserCommand = userActionCreator<CreateUserRequestDto, CreateUserResult>('create');
```

### Handler pattern

Every handler follows this structure:

```typescript
export default function makeHandler({ commandBus, repository, ...deps }: Dependencies) {
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

### Calling from routes/resolvers

```typescript
// Return type is inferred from the action's phantom Result — no manual generic needed
const id = await fastify.commandBus.execute(createUserCommand(req.body));
```

Do **not** pass a manual generic to `execute()`. The type is inferred from the action creator's `Result` parameter.

### Middlewares

Middlewares use an onion-model pipeline (composed via `reduceRight`). They must **never mutate** the action — always spread into a new object:

```typescript
function myMiddleware(action: Action<unknown>, handler: CommandHandler): Promise<unknown> {
  const enrichedAction = { ...action, meta: { ...action.meta, foo: 'bar' } } as Action<unknown>;
  return handler(enrichedAction);
}
```

There are separate types for command/query vs event middlewares:
- `CommandMiddleware` — returns `Promise<unknown>` (used by CommandBus and QueryBus)
- `EventMiddleware` — returns `void` (used by EventBus)

### Bus differences

| Bus | Purpose | Handler return | execute/emit return |
|---|---|---|---|
| `CommandBus` | State-changing mutations | `Promise<unknown>` | `Promise<R>` (inferred) |
| `QueryBus` | Idempotent reads | `Promise<unknown>` | `Promise<R>` (inferred) |
| `EventBus` | Fire-and-forget notifications | `void` | `void` |

Commands and queries share a `createRequestBus` factory in `src/shared/cqrs/request-bus.ts`.
The event bus is a separate implementation with a `logger` dependency for debug-level warnings
when events have no subscribers.

## Dependency injection

DI uses [Awilix](https://github.com/jeffijoe/awilix) with `@fastify/awilix`.

- Global dependencies (`db`, `logger`, `buses`, `repositoryBase`) are registered in `src/modules/index.ts`
- Module-specific dependencies are declared via `declare global { export interface Dependencies { ... } }` in the module's `index.ts`
- Repositories, mappers, domain services are auto-loaded as singletons from `src/modules/**/*.{repository,mapper,service,domain}.ts`
- Handlers and event-handlers are auto-loaded with `asyncInit: 'init'` from `src/modules/**/*.{handler,event-handler}.ts`
- All handlers receive dependencies as a single destructured object: `function makeX({ dep1, dep2 }: Dependencies)`

## Database

- Client: `postgres` (postgres.js) — uses tagged template literals for parameterized queries
- Connection: lazy singleton via `getDb()` in `src/shared/db/postgres.ts`
- Migrations/seeds: DBMate (SQL files in `db/migrations/` and `db/seeds/`)
- Transaction support: `withTransaction(async (tx) => { ... })`
- Repository base: `SqlRepositoryBase` provides generic CRUD (insert, findOneById, findAll, findAllPaginated, update, delete)

SQL parameterization rules:
- Always use tagged templates: `` db`SELECT * FROM ${db(tableName)} WHERE id = ${id}` ``
- Table names use `db(tableName)` (identifier interpolation)
- Values use `${value}` (parameterized automatically)
- Condition composition uses `joinConditions()` from `src/shared/db/postgres.ts`

## Coding conventions

### Style
- Biome enforces: single quotes, 2-space indent, trailing commas, semicolons, LF line endings
- Max line width: 100 characters
- File naming: `kebab-case` only (enforced by Biome)
- No enums — use `const` objects with derived types (e.g. `UserRoles`)
- No classes for business logic — prefer factory functions and composition
- No `any` — Biome's `noExplicitAny` is an error (relaxed only in test files)
- No `console` — use the injected `logger` (Pino)

### TypeScript
- `strict: true` with `noImplicitAny: true`
- Path aliases: `#src/*` maps to `./src/*`, `#tests/*` maps to `./tests/*`
- Always include `.ts` extension in imports (ESM requirement)
- Prefer `type` imports: `import type { Foo } from './bar.ts'`

### API
- All REST routes are prefixed with `/api` (configured in `src/server/index.ts`)
- Schemas use TypeBox (`Type.Object`, `Type.String`, etc.)
- Routes handle HTTP concerns only — no business logic in routes
- GraphQL resolvers co-locate with their REST route counterparts

### Testing
- Unit/integration tests: `*.spec.ts` files next to source, using `node:test` with `describe`/`it`/`assert`
- E2E tests: Cucumber features in `tests/`, step definitions in `tests/<feature>/`
- Load tests: k6 scripts in `tests/<feature>/`
- Test server: use `buildApp()` from `tests/support/server.ts` — creates a Fastify instance without listening

### Exceptions
- Domain errors extend `ExceptionBase` (in `src/shared/exceptions/`)
- Built-in exceptions: `NotFoundException`, `ConflictException`, `DatabaseErrorException`, `BadRequestException`
- Always include a descriptive message: `throw new NotFoundException('User with id X not found')`

## Adding a new module

1. Create `src/modules/<name>/` with the vertical slice structure
2. Create `src/modules/<name>/index.ts` with `actionCreatorFactory('<name>')` and `declare global` Dependencies
3. Create domain types in `domain/<name>.types.ts`
4. Create repository port in `database/<name>.repository.port.ts` (interface extending `RepositoryPort<Entity>`)
5. Create repository adapter in `database/<name>.repository.ts` (implements the port)
6. Create mapper in `<name>.mapper.ts` (implements `Mapper<Entity, DbModel, ResponseDto>`)
7. Create command/query handlers with action creators embedding `<Payload, Result>` types
8. Create routes and/or resolvers — call `bus.execute(action)` without manual generics
9. Create a DB migration: `pnpm db:create-migration <name>`
10. Run `pnpm check` to validate

## Adding a new CQRS middleware

1. Define the middleware function in `src/shared/cqrs/middlewares.ts` (or a new file)
2. Match the correct signature: `CommandMiddleware` for command/query buses, `EventMiddleware` for event bus
3. Never mutate the action — spread into a new object
4. Register in `src/shared/cqrs/index.ts` via `busInstance.addMiddleware(myMiddleware)`
5. Middleware order matters: first added = outermost wrapper

## Common mistakes to avoid

- Importing DB/infrastructure code in handlers (violates architecture boundaries)
- Using `execute<ManualType>(action)` instead of letting the type be inferred from the action creator
- Mutating `action.meta` in middleware instead of spreading
- Using `ReturnType<typeof creator>` for handler params (incompatible with register — use `HandlerAction<typeof creator>`)
- Forgetting `.ts` extensions in imports
- Using `npm` or `yarn` instead of `pnpm`
- Using `console.log` instead of the injected Pino `logger`
- Adding `enum` types (use const objects + derived types)
- Putting business logic in route files
- Directly importing from one module into another
