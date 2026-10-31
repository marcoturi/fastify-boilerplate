import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { SubError } from '#src/shared/exceptions/index.ts';

// `.default` is needed because Ajv and ajv-formats are CJS packages.
// Under `"module": "NodeNext"`, TypeScript resolves the default import as
// the CJS `module.exports` wrapper, requiring `.default` to reach the
// actual constructor / function at the type level.
// `example` is allowed as on the Fastify instance (src/index.ts), so the route schemas
// compile here too (e.g. to validate GraphQL input with the same rules as REST).
export const ajv = addFormats.default(new Ajv.default({ keywords: ['example'] }), [
  'date-time',
  'time',
  'date',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uri',
  'uri-reference',
  'uuid',
  'uri-template',
  'json-pointer',
  'relative-json-pointer',
  'regex',
]);

/** The errors of a failed validation (Ajv's, or Fastify's request validation) as sub-errors,
 *  the shape both transports send: one per invalid field, with its JSON pointer */
export function toSubErrors(
  errors: readonly { instancePath: string; message?: string }[] | null | undefined,
): SubError[] {
  return (errors ?? []).map((error) => ({
    path: error.instancePath,
    message: error.message ?? '',
  }));
}
