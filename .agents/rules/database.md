---
paths:
  - "src/shared/db/**"
  - "src/shared/ddd/**"
  - "src/modules/**/database/**"
  - "src/modules/**/*.mapper.ts"
  - "db/**"
---

# Database

SQL belongs in repository files only. Handlers use the repository **port** (interface): from
`src/shared/db/` or `database/` they import only `*.port.ts` files, never the adapter or the DB client.

- Client: `postgres` (postgres.js) — uses tagged template literals for parameterized queries
- Connection: lazy singleton via `getDb()` in `src/shared/db/postgres.ts`; close with `closeDbConnection()`
- Transaction support: `withTransaction(async (tx) => { ... })` in `src/shared/db/postgres.ts`
- Repository base: `SqlRepositoryBase` (in `src/shared/db/sql-repository.base.ts`) provides generic CRUD (insert, findOneById, findAll, findAllPaginated, update, delete)
- Repository ports extend `RepositoryPort<Entity>` (in `src/shared/db/repository.port.ts`)
- Mapper interface: `Mapper<DomainEntity, DbRecord, Response>` with `toPersistence`, `toDomain`, `toResponse` (in `src/shared/ddd/mapper.interface.ts`); `toPersistence` validates the record with the shared Ajv instance

## Migrations

DBMate runs plain SQL files from `db/migrations/` (seeds in `db/seeds/`).

- Create one with `pnpm db:create-migration <name>`
- One table per migration
- Every migration is reversible: a `-- migrate:down` section that undoes `-- migrate:up`
- Never edit a migration that has already run anywhere: add a new one

## SQL parameterization

- Always use tagged templates: `` db`SELECT * FROM ${db(tableName)} WHERE id = ${id}` ``
- Table names use `db(tableName)` (identifier interpolation)
- Values use `${value}` (parameterized automatically)
- Condition composition uses `joinConditions()` from `src/shared/db/postgres.ts`
