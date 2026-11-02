---
paths:
  - "src/config/**"
  - "src/instrumentation.ts"
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
  (env-schema + TypeBox). A new variable goes there and in `.env.example`; in
  `docker-compose.yml` only when the container needs a value other than the one in `.env`
  (the `app` service reads `.env` through `env_file`)

## Docker

- The image runs the TypeScript sources directly (no build step) as a non-root user
- Only `package.json`, the production `node_modules` and `src/` reach the image: a file needed at
  runtime outside `src/` must be copied explicitly and let in by `.dockerignore`, which admits
  only what the Dockerfile copies
- Migrations do not run in the image: `db/` is excluded and `pnpm db:migrate` runs separately

## CI and release

- `ci.yml` runs on pull requests; its `Check and test` job is a required status check of the
  `main` ruleset. `release.yml` runs on pushes to `main` and repeats the checks before publishing
- semantic-release pushes the release commit with the `GH_TOKEN` secret (a personal access token
  allowed to bypass the ruleset)
- Actions are pinned to major tags (e.g. `actions/checkout@v7`), not to commit digests: a
  deliberate choice
- `db:migrate` runs with `--no-dump-schema`: there is no `db/schema.sql` to commit
- Versions come from the commit type (`.releaserc`): `feat` → minor; `fix`, `perf`, `refactor`,
  `docs(README)` and reverts with the `This reverts commit <sha>.` body that `git revert` writes
  → patch; a `!` or a `BREAKING CHANGE:` (or `BREAKING-CHANGE:`) footer → major; `chore`,
  `ci`, `build`, `test`, `style` and other `docs` → no release

## Dependencies and hooks

- Renovate (`renovate.json`) proposes the dependency updates: what it automerges and how long
  it waits are in that file, each rule with its `description`
- pnpm refuses versions younger than `minimumReleaseAge` (`pnpm-workspace.yaml`), also when they
  are already in the lockfile: `pnpm update` picks older versions on its own, while a version
  pinned by hand must wait or go in `minimumReleaseAgeExclude`
- Renovate's `minimumReleaseAge` (`renovate.json`) must not be shorter than pnpm's: its PRs
  would pin versions that pnpm refuses to install
- pnpm installs only reviewed lifecycle scripts: a new dependency with one must be listed in
  `allowBuilds` in `pnpm-workspace.yaml`
- Husky hooks: pre-commit runs `biome check --staged` (it fails, it does not fix), `type:check`,
  `deps:validate` and `test`; commit-msg runs commitlint (Conventional Commits). The hooks need
  `pnpm` on the `PATH`
