import { type Static, Type } from 'typebox';

/** Shared `$id` for the error envelope. Registered once on the instance via
 *  `fastify.addSchema(apiErrorResponseSchema)` (see error-handler plugin) and
 *  referenced from routes through {@link apiErrorResponseRef}. */
export const API_ERROR_RESPONSE_ID = 'ApiErrorResponse';

export const apiErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ example: 400 }),
    message: Type.String({ example: 'Validation Error' }),
    error: Type.String({ example: 'Bad Request' }),
    correlationId: Type.String({ example: 'YevPQs' }),
    // Field-level validation errors — only present on 400 validation failures.
    // Shape matches what the error handler emits from `error.validation`.
    subErrors: Type.Optional(
      Type.Array(
        Type.Object({
          path: Type.String({ example: '/email' }),
          message: Type.String({ example: 'must match format "email"' }),
        }),
        { description: 'List of field-level validation errors' },
      ),
    ),
  },
  { $id: API_ERROR_RESPONSE_ID },
);

/** Reusable reference to the shared error schema for route response definitions —
 *  used for specific codes (e.g. `response: { 409: apiErrorResponseRef }`) and for the
 *  global `4XX`/`5XX` ranges (see swagger plugin). Keeps type inference through the
 *  TypeBox type provider instead of a raw `{ $ref: '...' }` object. */
export const apiErrorResponseRef = Type.Ref(API_ERROR_RESPONSE_ID, {
  description:
    'Error response. All errors share this shape; `correlationId` correlates it to logs.',
});

export type ApiErrorResponse = Static<typeof apiErrorResponseSchema>;
