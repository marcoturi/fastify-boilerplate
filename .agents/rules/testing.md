---
paths:
  - "**/*.spec.ts"
  - "tests/**"
  - "cucumber.mjs"
---

# Testing

- Unit/integration tests: `*.spec.ts` files next to source, using `node:test` with `describe`/`it`/`assert`
- E2E tests: Cucumber features in `tests/<module>/<slice>/<scenario>.feature` (next to the slice
  they cover, e.g. `tests/user/create-user/`); step definitions in `tests/<module>/*.steps.ts`,
  shared steps in `tests/shared/`
- Cover both REST and GraphQL when a slice exposes both
- Load tests: k6 scripts (`*.k6.ts`) in `tests/<module>/<slice>/`
- Test server: use `buildApp()` from `tests/support/server.ts` — creates a Fastify instance without listening
- Tag scenarios that touch users with `@user`: the hook truncates the table before each one, so
  scenarios stay independent
- E2E tests need a running Postgres with migrations applied: `docker compose up postgres -d`,
  then `pnpm db:migrate`, then `pnpm test:e2e`
