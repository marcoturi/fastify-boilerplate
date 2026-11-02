#!/usr/bin/env bash
# Starts the server, generates REST + GraphQL client types, then stops the server.
# Used by CI (release pipeline) and can be run locally.
set -euo pipefail

PORT=3000
SERVER_URL="http://127.0.0.1:$PORT"
MAX_WAIT=30  # seconds

# ── Start the server in the background ──────────────────────────────────────
# A server already on the port would answer the polling below and give its own types
if curl -sf "$SERVER_URL/health" > /dev/null 2>&1; then
  echo "Port $PORT is in use: stop the server running there first" >&2
  exit 1
fi
# .env provides the database settings locally (in CI the workflow sets them). Telemetry stays
# off and the port is the one polled below, whatever .env says: Node keeps a variable already
# in the environment over the same one in the file.
OTEL_SDK_DISABLED=true PORT=$PORT node --env-file-if-exists=.env ./src/index.ts &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# ── Wait for the health endpoint ────────────────────────────────────────────
echo "Waiting for server to be ready…"
elapsed=0
until curl -sf "$SERVER_URL/health" > /dev/null 2>&1; do
  kill -0 "$SERVER_PID" 2>/dev/null || { echo "Server exited before becoming ready" >&2; exit 1; }
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
