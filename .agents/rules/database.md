---
paths:
  - "src/shared/db/**"
  - "src/shared/ddd/**"
  - "src/modules/**/database/**"
  - "src/modules/**/*.mapper.ts"
  - "src/modules/**/*.service.ts"
  - "db/**"
---

# Database

- Client: `postgres` (postgres.js) — uses tagged template literals for parameterized queries
- Connection and transactions: `getDb()`, `closeDbConnection()` and `withTransaction()` in
  `src/shared/db/postgres.ts`; their JSDoc says how they behave. Call `withTransaction()` from a
  service or a repository: handlers may not import `src/shared/db/` beyond ports
  (dependency-cruiser), so a handler that needs a transaction delegates it to a service
- Repository base: `sqlRepositoryBase(db)` (in `src/shared/db/sql-repository.base.ts`), registered in DI
  as `repositoryBase` already bound to the transaction-aware `db`, provides the generic CRUD of
  `RepositoryPort`
- Errors: repository methods throw domain exceptions, never a driver error. The base maps them
  for its methods and for the custom ones it receives (`mapDatabaseErrors` in
  `src/shared/db/database-errors.ts`): a unique violation becomes `AlreadyExistsException`, a
  value the column cannot hold (malformed uuid, NUL character) `ArgumentInvalidException`,
  anything else `DatabaseErrorException`. A repository that does not use the base calls it itself
- Repository ports extend `RepositoryPort<Entity>` (in `src/shared/db/repository.port.ts`)
- Mapper interface: `Mapper<DomainEntity, DbRecord, Response>` with `toPersistence`, `toDomain`, `toResponse` (in `src/shared/ddd/mapper.interface.ts`). The interface does not validate anything: each mapper's
  `toPersistence` validates the record against its schema with the shared Ajv instance, as `userMapper` does

## Migrations

DBMate runs plain SQL files from `db/migrations/` (seeds in `db/seeds/`).

- Create one with `pnpm db:create-migration <name>`
- One table per migration
- Every migration is reversible: a `-- migrate:down` section that undoes `-- migrate:up`
- Never edit a migration that has already run anywhere: add a new one
- Seeds are recorded in their own table, `schema_seeds`, so a migration rollback never meets
  one. Write their rows with `ON CONFLICT DO NOTHING`: a seed must be safe to run again

## SQL parameterization

- Always use tagged templates: `` db`SELECT * FROM ${db(tableName)} WHERE id = ${id}` ``
- Table names use `db(tableName)` (identifier interpolation)
- Values use `${value}` (parameterized automatically)
- Custom queries are methods the repository passes to the base, which hands them helpers bound to
  its client and table: `paginate(params, conditions)` returns a page plus the total count in one
  query. A filtered list only lists its conditions: see
  `findAllPaginatedFiltered` in `src/modules/user/database/user.repository.ts`
