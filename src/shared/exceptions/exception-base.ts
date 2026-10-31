import { getRequestId } from '#src/shared/app/app-request-context.ts';

/**
 * Transport-neutral error categories, named after the canonical gRPC codes (google.rpc.Code).
 * Exceptions carry one of these instead of an HTTP status: each transport maps it at its edge
 * (REST in the error-handler plugin, GraphQL in the Mercurius error formatter).
 */
export const ErrorCode = {
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INTERNAL: 'INTERNAL',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export abstract class ExceptionBase extends Error {
  abstract readonly code: ErrorCode;
  /** Finer-grained, stable reason clients can branch on (e.g. `USER_ALREADY_EXISTS`) */
  readonly reason?: string;

  public readonly correlationId: string;
  override readonly cause?: Error;
  readonly metadata?: unknown;

  /**
   * @param {string} message
   * @param cause
   * @param {Object} [metadata={}]
   * **BE CAREFUL** not to include sensitive info in 'metadata'
   * to prevent leaks since all exception's data will end up
   * in application's log files. Only include non-sensitive
   * info that may help with debugging.
   */
  constructor(message: string, cause?: Error, metadata?: unknown) {
    super(message);
    this.cause = cause;
    this.metadata = metadata;
    this.correlationId = getRequestId();
  }
}
