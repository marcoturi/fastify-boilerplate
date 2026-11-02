---
paths:
  - "src/modules/**"
  - "src/server/di/**"
---

# Modules and dependency injection

## Dependency injection

DI uses [Awilix](https://github.com/jeffijoe/awilix) with `@fastify/awilix` (wired in `src/server/di/index.ts`).

- Global dependencies are defined by `globalDependencies()` in `src/modules/index.ts` and registered in `src/server/di/index.ts`
- Module-specific dependencies are declared via `declare global { export interface Dependencies { ... } }` in the module's `index.ts`
- `src/server/di/index.ts` auto-loads the module files as singletons (the file patterns are
  there) and calls the handlers' `init()` at startup
- Container keys are the camelCase file names (AGENTS.md, "Factory functions"), unique across
  modules: a clash (two `create-user.handler.ts`, or a file named like a global dependency)
  fails at startup

## Adding a new module

1. Create `src/modules/<name>/` with the vertical slice structure
2. Create the action creator in `src/modules/<name>/<name>.action-creator.ts` with `actionCreatorFactory('<name>')`
3. Create `src/modules/<name>/index.ts` with the `declare global` Dependencies
4. Create domain types in `domain/<name>.types.ts`
5. Create repository port in `database/<name>.repository.port.ts` (interface extending `RepositoryPort<Entity>`)
6. Create repository adapter in `database/<name>.repository.ts` (implements the port)
7. Create mapper in `<name>.mapper.ts` (implements `Mapper<Entity, DbModel, ResponseDto>`)
8. Create command/query handlers with action creators embedding `<Payload, Result>` types
9. Create routes and/or resolvers — call `bus.execute(action)` without manual generics
10. Create a DB migration: `pnpm db:create-migration <name>`
11. Add unit specs and E2E scenarios (see the testing rule)
12. Run `pnpm check` and `pnpm deps:validate` to validate
