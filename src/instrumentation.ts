/**
 * OpenTelemetry instrumentation — loaded before the app via the --import flag.
 * CQRS tracing is a middleware instead (src/shared/cqrs/otel-middleware.ts).
 * Configured by the standard OpenTelemetry environment variables:
 * https://opentelemetry.io/docs/languages/sdk-configuration/general/
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import type { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

// The OpenTelemetry spec reads boolean env vars case-insensitively ("TRUE" disables it too)
if (process.env.OTEL_SDK_DISABLED?.toLowerCase() !== 'true') {
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
