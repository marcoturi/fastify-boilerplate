import { ErrorCode, ExceptionBase } from './exception-base.ts';

/** A field-level error: `path` is a JSON pointer to the invalid field (e.g. `/email`) */
export interface SubError {
  path: string;
  message: string;
}

/**
 * The client's input is invalid: transports send its message and `subErrors` to the client.
 * A programming error (a wrong argument between internal functions) is an InternalException,
 * whose message clients never see.
 */
export class ArgumentInvalidException extends ExceptionBase {
  readonly code = ErrorCode.INVALID_ARGUMENT;
  /** The invalid field, when the argument is an object; transports send it along */
  readonly subErrors?: SubError[];

  constructor(message: string, subErrors?: SubError[]) {
    super(message);
    this.subErrors = subErrors;
  }
}

/** Used to indicate that the entity already exists (usually a unique constraint in the database) */
export class AlreadyExistsException extends ExceptionBase {
  readonly code = ErrorCode.ALREADY_EXISTS;
}

/** Used to indicate that entity is not found */
export class NotFoundException extends ExceptionBase {
  readonly code = ErrorCode.NOT_FOUND;
}

/**
 * Used to indicate an internal error that does not fall under all other errors.
 * Transports never show its message to clients.
 */
export class InternalException extends ExceptionBase {
  readonly code = ErrorCode.INTERNAL;
}

export class DatabaseErrorException extends InternalException {}
