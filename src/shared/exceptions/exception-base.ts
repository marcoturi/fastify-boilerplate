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

  /** @param cause the error that led to this one: logged with it, never sent to clients */
  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}
