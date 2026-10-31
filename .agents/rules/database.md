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
- Transactions: `withTransaction(async () => { ... })` in `src/shared/db/postgres.ts`. The DI `db` is
  transaction-aware, so repositories called inside it join the transaction without receiving `tx`;
  a nested call joins the outer transaction. Publish domain events after it resolves
- Repository base: `SqlRepositoryBase` (in `src/shared/db/sql-repository.base.ts`) provides generic CRUD (insert, findOneById, findAll, findAllPaginated, update, delete)
- Repository ports extend `RepositoryPort<Entity>` (in `src/shared/db/repository.port.ts`)
- Mapper interface: `Mapper<DomainEntity, DbRecord, Response>` with `toPersistence`, `toDomain`, `toResponse` (in `src/shared/ddd/mapper.interface.ts`). The interface does not validate anything: each mapper's
  `toPersistence` validates the record against its schema with the shared Ajv instance, as `userMapper` does

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
- Custom queries compose conditions and ordering with the `where()` and `orderBy()` helpers of the
  repository base, bound to its client. Destructure them before spreading the base, so they do
  not become repository methods: `const { where, orderBy, ...base } = repositoryBase({ tableName, mapper })`
