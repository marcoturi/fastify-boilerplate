---
paths:
  - "src/config/**"
  - ".env.example"
  - "Dockerfile"
  - ".dockerignore"
  - "docker-compose.yml"
  - ".github/**"
  - ".husky/**"
  - "scripts/**"
  - "package.json"
  - "pnpm-workspace.yaml"
  - "renovate.json"
  - ".releaserc"
---

# Configuration, Docker, CI and release

## Configuration

- Environment variables are declared and validated in one place, `src/config/env.ts`
  (env-schema + TypeBox). A new variable goes there and in `.env.example`, and in
  `docker-compose.yml` if the containerized app needs it
- The code reads `env` from `#src/config/index.ts`, never `process.env` (the exception is
  `src/instrumentation.ts`, which runs before the config is loaded)

## Docker

- The image runs the TypeScript sources directly (no build step) as the non-root `fastify` user;
  the Dockerfile sets `NODE_ENV=production` and `HOST=0.0.0.0`
- Only `package.json`, the production `node_modules` and `src/` reach the image: a file needed at
  runtime outside `src/` must be copied explicitly and must not be excluded by `.dockerignore`
- Migrations do not run in the image: `db/` is excluded and `pnpm db:migrate` runs separately

## CI and release

- `ci.yml` runs on pull requests; its `Check and test` job is a required status check of the
  `main` ruleset. `release.yml` runs on pushes to `main` and repeats the checks before publishing
- semantic-release pushes the release commit with the `GH_TOKEN` secret (a personal access token
  allowed to bypass the ruleset). The release checkout keeps `persist-credentials: false`:
  otherwise the push uses the workflow credentials and the ruleset rejects it
- Actions are pinned to major versions (`@v7`), not to commit digests: a deliberate choice
- `db:migrate` runs with `--no-dump-schema`: there is no `db/schema.sql` to commit
- Versions come from the commit type (`.releaserc`): `feat` → minor; `fix`, `perf`, `refactor`,
  `style` and `docs(README)` → patch; a `!` or a `BREAKING CHANGE:` footer → major; `chore`,
  `ci`, `build`, `test` and other `docs` → no release

## Dependencies and hooks

- Renovate (`renovate.json`) proposes updates once a release is 3 days old and automerges minor
  and patch updates when CI passes
- pnpm refuses versions younger than `minimumReleaseAge` (`pnpm-workspace.yaml`), also when they
  are already in the lockfile: `pnpm update` picks older versions on its own, while a version
  pinned by hand must wait or go in `minimumReleaseAgeExclude`
- pnpm installs only reviewed lifecycle scripts: a new dependency with one must be listed in
  `allowBuilds` in `pnpm-workspace.yaml`
- Husky hooks: pre-commit runs `biome check --staged` (it fails, it does not fix), `type:check`,
  `deps:validate` and `test`; commit-msg runs commitlint (Conventional Commits). The hooks need
  `pnpm` on the `PATH`
