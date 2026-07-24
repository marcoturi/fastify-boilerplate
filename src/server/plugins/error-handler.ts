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
  FST_ERR_NOT_FOUND: () => ({
    message: 'Not Found',
    error: 'Not Found',
    statusCode: 404, //  'https://datatracker.ietf.org/doc/html/rfc7231#section-6.5.4',
  }),
};

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

    // Unexpected/unknown error
    fastify.log.error(error);
    return res.status(500).send({
      statusCode: 500,
      message: 'Internal Server Error', // https://datatracker.ietf.org/doc/html/rfc7231#section-6.6.1
      error: 'Internal Server Error',
      correlationId: getRequestId(),
    } satisfies ApiErrorResponse);
  });

  // Add the ExceptionResponse schema to the fastify instance
  fastify.addSchema(apiErrorResponseSchema);
}

// Export the plugin
export default fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
