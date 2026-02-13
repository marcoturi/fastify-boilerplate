#!/usr/bin/env bash
# Starts the server, generates REST + GraphQL client types, then stops the server.
# Used by CI (release pipeline) and can be run locally.
set -euo pipefail

SERVER_URL="http://127.0.0.1:3000"
MAX_WAIT=30  # seconds

# ── Start the server in the background ──────────────────────────────────────
node --import ./src/instrumentation.ts ./src/index.ts &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# ── Wait for the health endpoint ────────────────────────────────────────────
echo "Waiting for server to be ready…"
elapsed=0
until curl -sf "$SERVER_URL/health" > /dev/null 2>&1; do
  sleep 1
  elapsed=$((elapsed + 1))
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "Server did not become ready within ${MAX_WAIT}s" >&2
    exit 1
  fi
done
echo "Server is ready (took ${elapsed}s)"

# ── Generate REST types (OpenAPI) ───────────────────────────────────────────
echo "Generating REST client types…"
pnpm openapi-typescript "$SERVER_URL/api-docs/json" -o ./client/rest.d.ts

# ── Generate GraphQL types ──────────────────────────────────────────────────
echo "Generating GraphQL client types…"
pnpm graphql-codegen --config scripts/codegen.ts

echo "Done — client types written to client/"
