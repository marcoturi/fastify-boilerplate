import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { Static, TSchema } from 'typebox';
import { ArgumentInvalidException, type SubError } from '#src/shared/exceptions/index.ts';

// `.default` is needed because Ajv and ajv-formats are CJS packages.
// Under `"module": "NodeNext"`, TypeScript resolves the default import as
// the CJS `module.exports` wrapper, requiring `.default` to reach the
// actual constructor / function at the type level.
// `example` is allowed as on the Fastify instance (src/server/options.ts), so the route schemas
// compile here too (e.g. to validate GraphQL input with the same rules as REST).
export const ajv = addFormats.default(new Ajv.default({ keywords: ['example'] }));

/** The errors of a failed validation (Ajv's, or Fastify's request validation) as sub-errors,
 *  the shape both transports send: the JSON pointer of the invalid field and the message */
export function toSubErrors(
  errors:
    | readonly { instancePath: string; message?: string; params?: Record<string, unknown> }[]
    | null
    | undefined,
): SubError[] {
  return (errors ?? []).map((error) => ({
    // Ajv reports a missing field on its parent object: point to the field itself
    path:
      typeof error.params?.missingProperty === 'string'
        ? `${error.instancePath}/${error.params.missingProperty}`
        : error.instancePath,
    message: error.message ?? '',
  }));
}

/** GraphQL passes `null` for an optional argument the client set to null (e.g. `limit: null`,
 *  or a variable set to null): drop it, so the schema treats it as absent, like REST does */
function withoutNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withoutNulls);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) =>
        item === null ? [] : [[key, withoutNulls(item)]],
      ),
    );
  }
  return value;
}

/** Compiles `schema` with the shared Ajv instance into a function that returns its input
 *  without null fields, typed by the schema, or throws ArgumentInvalidException with a
 *  sub-error for the first invalid field */
export function validator<T extends TSchema>(schema: T) {
  const validate = ajv.compile<Static<T>>(schema);
  return (input: unknown): Static<T> => {
    const value = withoutNulls(input);
    if (!validate(value)) {
      throw new ArgumentInvalidException('Validation error', toSubErrors(validate.errors));
    }
    return value;
  };
}
