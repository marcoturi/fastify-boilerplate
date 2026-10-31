import { STATUS_CODES } from 'node:http';
import type { FastifyBaseLogger, FastifyError, FastifyInstance, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import {
  type ApiErrorResponse,
  apiErrorResponseSchema,
} from '#src/shared/api/api-error.response.ts';
import { getRequestId } from '#src/shared/app/app-request-context.ts';
import { type ErrorCode, ExceptionBase } from '#src/shared/exceptions/index.ts';

// Transport-neutral exception codes → HTTP status codes (mapping from https://google.aip.dev/193)
const httpStatusByCode: Record<ErrorCode, number> = {
  INVALID_ARGUMENT: 400,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  INTERNAL: 500,
};

/** The HTTP error status the error carries (Fastify and its plugins set one), else 500 */
function statusCodeOf(error: FastifyError | Error): number {
  return 'statusCode' in error &&
    typeof error.statusCode === 'number' &&
    error.statusCode >= 400 &&
    error.statusCode < 600
    ? error.statusCode
    : 500;
}

/** Logs a 5xx. Load shedding (under-pressure's 503) is expected under load: a warning without
 *  the stack, which would cost time and log volume exactly when the server is overloaded */
function logServerError(log: FastifyBaseLogger, error: FastifyError | Error) {
  if ('code' in error && error.code === 'FST_UNDER_PRESSURE') {
    log.warn({ code: error.code }, 'Request rejected: the server is under pressure');
  } else {
    log.error(error);
  }
}

function sendError(
  res: FastifyReply,
  statusCode: number,
  message: string,
  subErrors?: ApiErrorResponse['subErrors'],
) {
  return res.status(statusCode).send({
    statusCode,
    message,
    error: STATUS_CODES[statusCode] ?? 'Error', // HTTP reason phrase, e.g. "Bad Request"
    correlationId: getRequestId(),
    subErrors,
  } satisfies ApiErrorResponse);
}

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, _, res) => {
    // Known exceptions: 4xx are expected outcomes (log at warn to avoid alert noise),
    // 5xx are genuine failures (log at error) and their message stays internal.
    if (error instanceof ExceptionBase) {
      const statusCode = httpStatusByCode[error.code];
      if (statusCode >= 500) {
        fastify.log.error(error);
        return sendError(res, statusCode, 'Internal Server Error');
      }
      fastify.log.warn(error);
      return sendError(res, statusCode, error.message);
    }

    // Request validation (schema) errors, with one entry per invalid field
    if ('validation' in error && error.validation) {
      return sendError(
        res,
        400,
        'Validation error',
        error.validation.map((validationError) => ({
          path: validationError.instancePath,
          message: validationError.message ?? '',
        })),
      );
    }

    // Errors raised by Fastify or its plugins carry their own status: 4xx for malformed JSON,
    // an unsupported media type or a body too large, 503 from under-pressure when overloaded.
    // Keep it instead of a 500; unknown errors become a 500.
    const statusCode = statusCodeOf(error);
    if (statusCode < 500) {
      return sendError(res, statusCode, error.message);
    }

    // A 5xx message can hold internal details: answer with the reason phrase only
    logServerError(fastify.log, error);
    return sendError(res, statusCode, STATUS_CODES[statusCode] ?? 'Internal Server Error');
  });

  // Unknown routes never reach the error handler: answer with the same error envelope
  fastify.setNotFoundHandler((req, res) =>
    sendError(res, 404, `Route ${req.method}:${req.url} not found`),
  );

  // Add the ExceptionResponse schema to the fastify instance
  fastify.addSchema(apiErrorResponseSchema);
}

// Export the plugin
export default fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
