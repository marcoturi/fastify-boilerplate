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

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  // Register the ESM loader hook so OpenTelemetry can patch imported modules
  // (http, etc.). Must be called before any application imports.
  const { register } = await import('node:module');
  register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

  const { NodeSDK } = await import('@opentelemetry/sdk-node');
  const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
  const { FastifyOtelInstrumentation } = await import('@fastify/otel');

  const sdk = new NodeSDK({
    instrumentations: [
      new HttpInstrumentation(),
      // registerOnInitialization auto-registers the Fastify plugin on server creation
      new FastifyOtelInstrumentation({ registerOnInitialization: true }),
    ],
  });

  sdk.start();
}
