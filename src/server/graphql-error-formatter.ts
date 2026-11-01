import { STATUS_CODES } from 'node:http';
import type { FastifyBaseLogger } from 'fastify';
import { GraphQLError } from 'graphql';
import mercurius, { type MercuriusContext } from 'mercurius';
import { logServerError, statusCodeOf } from '#src/server/plugins/error-handler.ts';
import {
  ArgumentInvalidException,
  type ErrorCode,
  ExceptionBase,
  type SubError,
} from '#src/shared/exceptions/index.ts';

// Transport-neutral exception codes → GraphQL `extensions.code`
const graphqlCodeByCode: Record<ErrorCode, string> = {
  INVALID_ARGUMENT: 'BAD_USER_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
};

type Execution = Parameters<typeof mercurius.defaultErrorFormatter>[0];

function withCode(error: GraphQLError, message: string, code: string, subErrors?: SubError[]) {
  return new GraphQLError(message, {
    nodes: error.nodes,
    source: error.source,
    positions: error.positions,
    path: error.path,
    // Mercurius answers with the HTTP status of the original error, when it has one
    originalError: error.originalError,
    extensions: subErrors ? { code, subErrors } : { code },
  });
}

function formatError(error: GraphQLError, log: FastifyBaseLogger): GraphQLError {
  const original = error.originalError;
  if (!original || original instanceof mercurius.ErrorWithProps) {
    return error;
  }
  if ('code' in original && String(original.code).startsWith('MER_ERR_')) {
    return error;
  }
  if (original instanceof ExceptionBase && original.code !== 'INTERNAL') {
    const code = original.reason ?? graphqlCodeByCode[original.code];
    const subErrors = original instanceof ArgumentInvalidException ? original.subErrors : undefined;
    return withCode(error, original.message, code, subErrors);
  }
  // Malformed JSON or a body too large (4xx), under-pressure's load shedding (503)
  const statusCode = statusCodeOf(original);
  if (statusCode < 500) {
    return error;
  }
  logServerError(log, original);
  return withCode(
    error,
    STATUS_CODES[statusCode] ?? 'Internal Server Error',
    graphqlCodeByCode.INTERNAL,
  );
}

/**
 * Maps exceptions thrown by resolvers (and the handlers behind them) to GraphQL errors, as
 * REST does: known exceptions get a stable `extensions.code` (their `reason` when they have
 * one), and invalid arguments list their invalid fields in `extensions.subErrors`; errors
 * raised by Fastify or its plugins before the query runs keep their HTTP status; anything
 * unexpected is logged and masked so internal details never reach clients.
 * Errors produced by GraphQL or Mercurius themselves (query syntax and validation,
 * `ErrorWithProps`) are left as they are.
 */
export function graphqlErrorFormatter(execution: Execution, context: MercuriusContext) {
  const log = context.reply?.log ?? context.app.log;
  const errors = execution.errors.map((error) => formatError(error, log));
  return mercurius.defaultErrorFormatter({ ...execution, errors }, context);
}
