import { GraphQLError } from 'graphql';
import mercurius, { type MercuriusContext } from 'mercurius';
import { type ErrorCode, ExceptionBase } from '#src/shared/exceptions/index.ts';

// Transport-neutral exception codes → GraphQL `extensions.code`
const graphqlCodeByCode: Record<ErrorCode, string> = {
  INVALID_ARGUMENT: 'BAD_USER_INPUT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INTERNAL: 'INTERNAL_SERVER_ERROR',
};

type Execution = Parameters<typeof mercurius.defaultErrorFormatter>[0];

function withCode(error: GraphQLError, message: string, code: string) {
  return new GraphQLError(message, {
    nodes: error.nodes,
    source: error.source,
    positions: error.positions,
    path: error.path,
    extensions: { code },
  });
}

/**
 * Maps exceptions thrown by resolvers (and the handlers behind them) to GraphQL errors:
 * known exceptions get a stable `extensions.code` (their `reason` when they have one),
 * anything unexpected is logged and masked so internal details never reach clients.
 * Errors produced by GraphQL or Mercurius themselves (query syntax and validation,
 * `ErrorWithProps`) are left as they are.
 */
export function graphqlErrorFormatter(execution: Execution, context: MercuriusContext) {
  const log = context.reply?.log ?? context.app.log;

  const errors = execution.errors.map((error) => {
    const original = error.originalError;
    if (!original || original instanceof mercurius.ErrorWithProps) {
      return error;
    }
    if ('code' in original && String(original.code).startsWith('MER_ERR_')) {
      return error;
    }
    if (original instanceof ExceptionBase && original.code !== 'INTERNAL') {
      return withCode(error, original.message, original.reason ?? graphqlCodeByCode[original.code]);
    }
    log.error({ err: original }, original.message);
    return withCode(error, 'Internal Server Error', graphqlCodeByCode.INTERNAL);
  });

  return mercurius.defaultErrorFormatter({ ...execution, errors }, context);
}
