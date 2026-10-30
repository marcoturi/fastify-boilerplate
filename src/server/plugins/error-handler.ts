import { STATUS_CODES } from 'node:http';
import type { FastifyError, FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import {
  type ApiErrorResponse,
  apiErrorResponseSchema,
} from '#src/shared/api/api-error.response.ts';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import { ExceptionBase } from '#src/shared/exceptions/index.ts';

const fastifyErrorCodesMap: Record<
  string,
  | ((error: FastifyError) => {
      statusCode: number;
      message: string;
      error: string;
      correlationId?: string;
      subErrors?: { path: string; message: string }[];
    })
  | undefined
> = {
  FST_ERR_VALIDATION: (error: FastifyError) => ({
    subErrors: (error.validation ?? []).map((validationError) => ({
      path: validationError.instancePath,
      message: validationError.message ?? '',
    })),
    statusCode: 400,
    message: 'Validation error',
    error: 'Bad Request', // https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.1
  }),
};

function isClientError(
  error: FastifyError | Error,
): error is FastifyError & { statusCode: number } {
  return (
    'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 500
  );
}

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, _, res) => {
    // Handle fastify errors
    if ('code' in error) {
      const fastifyError = fastifyErrorCodesMap[error.code];
      if (fastifyError) {
        const response = fastifyError(error as FastifyError);
        response.correlationId = getRequestId();
        return res.status(response.statusCode).send(response);
      }
    }

    // Known domain errors: 4xx are expected outcomes (log at warn to avoid alert noise),
    // 5xx are genuine failures (log at error).
    if (error instanceof ExceptionBase) {
      if (error.statusCode >= 500) {
        fastify.log.error(error);
      } else {
        fastify.log.warn(error);
      }
      return res.status(error.statusCode).send({
        statusCode: error.statusCode,
        message: error.message,
        error: error.error,
        correlationId: getRequestId(),
      } satisfies ApiErrorResponse);
    }

    // Other client errors raised by Fastify or its plugins (malformed JSON, unsupported
    // media type, body too large, ...) carry their own 4xx status: keep it instead of a 500.
    if (isClientError(error)) {
      return res.status(error.statusCode).send({
        statusCode: error.statusCode,
        message: error.message,
        error: STATUS_CODES[error.statusCode] ?? 'Bad Request',
        correlationId: getRequestId(),
      } satisfies ApiErrorResponse);
    }

    // Unexpected/unknown error
    fastify.log.error(error);
    return res.status(500).send({
      statusCode: 500,
      message: 'Internal Server Error', // https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1
      error: 'Internal Server Error',
      correlationId: getRequestId(),
    } satisfies ApiErrorResponse);
  });

  // Unknown routes never reach the error handler: answer with the same error envelope
  fastify.setNotFoundHandler((req, res) =>
    res.status(404).send({
      statusCode: 404,
      message: `Route ${req.method}:${req.url} not found`,
      error: 'Not Found', // https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4
      correlationId: getRequestId(),
    } satisfies ApiErrorResponse),
  );

  // Add the ExceptionResponse schema to the fastify instance
  fastify.addSchema(apiErrorResponseSchema);
}

// Export the plugin
export default fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
