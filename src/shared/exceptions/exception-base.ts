import { getRequestId } from '#src/shared/app/app-request-context.ts';

export interface SerializedException {
  message: string;
  error: string;
  correlationId: string;
  statusCode?: number;
  stack?: string;
  cause?: string;
  metadata?: unknown;
}

export abstract class ExceptionBase extends Error {
  abstract error: string;
  abstract statusCode: number;

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
      error: this.error,
      statusCode: this.statusCode,
      stack: this.stack,
      correlationId: this.correlationId,
      cause: JSON.stringify(this.cause),
      metadata: this.metadata,
    };
  }
}
