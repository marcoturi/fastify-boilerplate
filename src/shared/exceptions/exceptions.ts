import { ErrorCode, ExceptionBase } from './exception-base.ts';

/** A field-level error: `path` is a JSON pointer to the invalid field (e.g. `/email`) */
export interface SubError {
  path: string;
  message: string;
}

/**
 * Used to indicate that an incorrect argument was provided to a method/function/class constructor
 *
 * @class ArgumentInvalidException
 * @extends {ExceptionBase}
 */
export class ArgumentInvalidException extends ExceptionBase {
  readonly code = ErrorCode.INVALID_ARGUMENT;
  /** One entry per invalid field, when the argument is an object; transports send them along */
  readonly subErrors?: SubError[];

  constructor(message: string, subErrors?: SubError[]) {
    super(message);
    this.subErrors = subErrors;
  }
}

/**
 * Used to indicate that the entity already exists (usually a unique constraint in the database)
 *
 * @class AlreadyExistsException
 * @extends {ExceptionBase}
 */
export class AlreadyExistsException extends ExceptionBase {
  readonly code = ErrorCode.ALREADY_EXISTS;
}

/**
 * Used to indicate that entity is not found
 *
 * @class NotFoundException
 * @extends {ExceptionBase}
 */
export class NotFoundException extends ExceptionBase {
  static readonly message = 'Not found';
  readonly code = ErrorCode.NOT_FOUND;

  constructor(message: string = NotFoundException.message, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Used to indicate an internal error that does not fall under all other errors.
 * Transports never show its message to clients.
 *
 * @class InternalException
 * @extends {ExceptionBase}
 */
export class InternalException extends ExceptionBase {
  static readonly message: string = 'Internal error';
  readonly code = ErrorCode.INTERNAL;

  constructor(message: string = InternalException.message, cause?: Error) {
    super(message, cause);
  }
}

export class DatabaseErrorException extends InternalException {
  static override readonly message = 'Database error';

  constructor(message: string = DatabaseErrorException.message, cause?: Error) {
    super(message, cause);
  }
}
