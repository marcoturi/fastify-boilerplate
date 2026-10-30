/**
 * OpenTelemetry instrumentation — loaded before the app via the --import flag.
 *
 * Registered instrumentations:
 *   - HTTP           — inbound/outbound HTTP request spans
 *   - @fastify/otel  — Fastify route + lifecycle hook spans (official Fastify plugin)
 *
 * CQRS tracing is handled by application-level middleware that uses
 * @opentelemetry/api directly (see src/shared/cqrs/otel-middleware.ts).
 *
 * Controlled entirely by standard OpenTelemetry environment variables:
 *   OTEL_SDK_DISABLED            — set to "true" to disable (default in .env.example)
 *   OTEL_SERVICE_NAME            — logical service name (e.g. "fastify-boilerplate")
 *   OTEL_EXPORTER_OTLP_ENDPOINT  — collector URL  (e.g. http://localhost:4318)
 *   OTEL_TRACES_EXPORTER         — trace exporter  (default: "otlp")
 *   OTEL_METRICS_EXPORTER        — metrics exporter (default: "otlp")
 *   OTEL_LOGS_EXPORTER           — logs exporter    (default: "otlp")
 *
 * Full reference:
 *   https://opentelemetry.io/docs/languages/sdk-configuration/general/
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  // Register the ESM loader hook so OpenTelemetry can patch imported modules
  // (http, etc.). Must be called before any application imports.
  // Uses synchronous in-thread hooks (module.registerHooks): module.register() with
  // @opentelemetry/instrumentation/hook.mjs is runtime-deprecated since Node 26 (DEP0205).
  // import-in-the-middle is resolved from @opentelemetry/instrumentation so the loader
  // shares state with the copy that registers the instrumentation hooks.
  const iitmHooksPath = createRequire(
    import.meta.resolve('@opentelemetry/instrumentation'),
  ).resolve('import-in-the-middle/register-hooks.mjs');
  const { register } = (await import(pathToFileURL(iitmHooksPath).href)) as {
    register: () => void;
  };
  register();

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
  const { FastifyOtelInstrumentation } = await import('@fastify/otel');

  sdk = new NodeSDK({
    instrumentations: [
      new HttpInstrumentation(),
      // registerOnInitialization auto-registers the Fastify plugin on server creation
      new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    ],
  });

  sdk.start();
}

/** Flushes and shuts down the OpenTelemetry SDK so buffered spans/metrics are exported
 *  before the process exits. No-op when telemetry is disabled. Call from graceful shutdown. */
export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown();
}
