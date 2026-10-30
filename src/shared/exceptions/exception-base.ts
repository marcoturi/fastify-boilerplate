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

export interface SerializedException {
  message: string;
  code: ErrorCode;
  reason?: string;
  correlationId: string;
  stack?: string;
  cause?: string;
  metadata?: unknown;
}

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

  /**
   * By default in NodeJS Error objects are not
   * serialized properly when sending plain objects
   * to external processes. This method is a workaround.
   * Keep in mind not to return a stack trace to user when in production.
   * https://iaincollins.medium.com/error-handling-in-javascript-a6172ccdf9af
   */
  toJSON(): SerializedException {
    return {
      message: this.message,
      code: this.code,
      reason: this.reason,
      stack: this.stack,
      correlationId: this.correlationId,
      cause: JSON.stringify(this.cause),
      metadata: this.metadata,
    };
  }
}
