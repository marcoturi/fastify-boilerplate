# AGENTS.md

> Instructions for AI coding assistants (Cursor, Claude Code, GitHub Copilot, etc.)

## Project overview

A production-ready Fastify 5 boilerplate using Clean Architecture, CQRS, DDD, and functional programming.
TypeScript strict mode, ESM-only, Node in the version of `.nvmrc` (native TS execution, no build step).

## Quick reference

| What | Where |
|---|---|
| Package manager | `pnpm` (never npm or yarn) |
| Linter + formatter | Biome (never ESLint or Prettier) |
| Validation after changes | `pnpm check` (runs `biome check && tsc --noEmit`) |
| Unit tests | `pnpm test:unit` (node:test) |
| E2E tests | `pnpm test:e2e` (Cucumber + Gherkin, needs Postgres) |
| Architecture validation | `pnpm deps:validate` (dependency-cruiser) |
| DB migrations | `pnpm db:migrate` (DBMate) |

Always run `pnpm check` after making changes. If it fails on formatting, import order or other safe fixes, run `pnpm check:fix`, then `pnpm check` again.

## Path-specific rules

Detailed rules live in `.agents/rules/`, one file per area. The `paths` list in each file's
frontmatter says which files it covers: read the matching rule before changing those files.
Claude Code loads them automatically through the `.claude/rules` symlink.

| Rule | Covers |
|---|---|
| [`clean-architecture.md`](.agents/rules/clean-architecture.md) | Layer responsibilities, services, when to split a file |
| [`cqrs.md`](.agents/rules/cqrs.md) | Buses, action creators, handlers, middlewares, calls from routes/resolvers |
| [`database.md`](.agents/rules/database.md) | Repositories, mappers, SQL, migrations |
| [`api.md`](.agents/rules/api.md) | REST routes, TypeBox schemas, GraphQL resolvers, server setup |
| [`modules.md`](.agents/rules/modules.md) | Module structure, dependency injection, adding a module |
| [`testing.md`](.agents/rules/testing.md) | Unit, E2E and load tests |
| [`infra.md`](.agents/rules/infra.md) | Environment config, Docker, CI, release, dependencies, git hooks |

## Architecture

### Layer boundaries

The dependency flow is strictly **inward**: `Route/Resolver → Handler → (Service) → Domain + Repository`.
The domain is pure and never calls repositories; see `clean-architecture.md` for what each layer does.

The folders and what each file holds: [README](README.md#folder-structure).

Handlers get repositories through DI and use them only through their port interfaces: from
`src/shared/db/` or `database/` they import nothing but port files (`*.port.ts`), never an
adapter or the DB client. Repositories never import handlers or services, the domain never imports
request schemas (`*.schema.ts`), and `src/shared` never imports a module. `pnpm deps:validate`
enforces all of this. SQL belongs in repository files only.

### Module independence

Modules do not import from each other, except another module's domain events
(`domain/*.events.ts`), which are the cross-module contract; `pnpm deps:validate` enforces
this. Everything else goes through the CQRS buses:
- Commands/queries for request-response
- Events for fire-and-forget notifications

## Coding conventions

- Biome enforces formatting and most style rules (quotes, indentation, kebab-case file names,
  no `enum` (use a `const` object with a derived type, e.g. `UserRoles`), no `any` outside
  tests, no `console` (use the injected `logger`)): rely on `pnpm check` instead of restating them
- Code, comments, identifiers, log and error messages are in English
- Read `process.env` only in `src/config/env.ts`, which validates it; everything else imports
  `env` from `#src/config/index.ts`. The one exception is `src/instrumentation.ts`, which runs
  via `--import` before the config is loaded
- TypeScript: `strict: true`; always include the `.ts` extension in imports (ESM); prefer
  `import type { Foo } from './bar.ts'`
- Path aliases: `#src/*` maps to `./src/*`, `#tests/*` maps to `./tests/*` (Node
  [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) in `package.json`, not `tsconfig.json`).
  A file in a parent folder is imported through an alias, never with `../` (Biome
  `noRestrictedImports` enforces it); `./` is for the same folder and below

### Factory functions

No classes except errors: everything else is a factory function that returns an object. The
Cucumber World in `tests/support/` is a class because Cucumber requires it.

- **Name:** the camelCase key Awilix derives from the file name (`create-user.handler.ts` →
  `createUserHandler`, `user.repository.ts` → `userRepository`), so searching for a dependency
  finds its factory. No `make` or `create` prefix. Factories outside the container are named
  after what they produce (`requestBus`, `tracingMiddleware`).
- **Parameter:** one destructured `Dependencies` object, or none when the factory needs nothing
  (e.g. a pure domain). Factories outside the container take what they need
  (`requestBus(label)`, `tracingMiddleware(bus)`).
- **Return type:** inferred. Annotate it only when the factory implements an interface, so
  TypeScript checks the implementation against it: a repository port
  (`userRepository(...): UserRepository`), `Mapper<...>`, a bus type.
- **Exports:** in a file that default-exports a factory, every function lives inside it, public ones on the
  returned object and private helpers as inner closures. Besides the default-exported factory,
  such a file exports only types, schemas and, in handler files, the action creator: never
  standalone functions. Stateless helpers in `src/shared/` (e.g. `with-timeout.ts`) are plain
  exported functions.

### Exceptions

- Exceptions carry a transport-neutral `code` (`ErrorCode` in `src/shared/exceptions/`), never an
  HTTP status: each transport maps it at its edge (see the API rule,
  [Errors](.agents/rules/api.md#errors)), so handlers serve every transport alike
- Use the built-in exceptions in `src/shared/exceptions/exceptions.ts`. The error that caused one
  goes in `cause` (the native `Error` option); `ArgumentInvalidException` takes the invalid
  fields (`subErrors`) instead
- Domain errors extend one of them and may set a stable `reason` for clients
  (e.g. `UserAlreadyExistsError` → `USER_ALREADY_EXISTS`)
- Always include a descriptive message: `throw new NotFoundException('User with id X not found')`
