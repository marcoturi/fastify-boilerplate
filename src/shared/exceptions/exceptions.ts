import { ExceptionBase } from './exception-base';

enum ExceptionError {
  BAD_REQUEST = 'Bad Request',
  CONFLICT = 'Conflict',
  NOT_FOUND = 'Not Found',
  INTERNAL_SERVER_ERROR = 'Internal Server Error',
  DATABASE_ERROR = 'Database Error',
}

/**
 * Used to indicate that an incorrect argument was provided to a method/function/class constructor
 *
 * @class ArgumentInvalidException
 * @extends {ExceptionBase}
 */
export class ArgumentInvalidException extends ExceptionBase {
  readonly statusCode = 400;
  readonly error = ExceptionError.BAD_REQUEST;
}

/**
 * Used to indicate conflicting entities (usually in the database)
 *
 * @class ConflictException
 * @extends {ExceptionBase}
 */
export class ConflictException extends ExceptionBase {
  readonly error = ExceptionError.CONFLICT;
  readonly statusCode = 409;
}

/**
 * Used to indicate that entity is not found
 *
 * @class NotFoundException
 * @extends {ExceptionBase}
 */
export class NotFoundException extends ExceptionBase {
  static readonly message = ExceptionError.NOT_FOUND;
  readonly error = ExceptionError.NOT_FOUND;
  readonly statusCode = 404;

  constructor(message: string = NotFoundException.message) {
    super(message);
  }
}

/**
 * Used to indicate an internal server error that does not fall under all other errors
 *
 * @class InternalServerErrorException
 * @extends {ExceptionBase}
 */
export class InternalServerErrorException extends ExceptionBase {
  static readonly message = ExceptionError.INTERNAL_SERVER_ERROR;
  readonly error = ExceptionError.INTERNAL_SERVER_ERROR;
  constructor(message: string = InternalServerErrorException.message) {
    super(message);
  }

  readonly statusCode = 500;
}

export class DatabaseErrorException extends ExceptionBase {
  static readonly message = 'Database error';
  readonly error = ExceptionError.INTERNAL_SERVER_ERROR;
  constructor(
    message: string = InternalServerErrorException.message,
    cause?: Error,
  ) {
    super(message, cause);
  }

  readonly statusCode = 500;
}

export class ProviderErrorException extends ExceptionBase {
  static readonly message = 'Provider error';
  readonly error = ExceptionError.INTERNAL_SERVER_ERROR;
  constructor(
    message: string = InternalServerErrorException.message,
    cause?: Error,
  ) {
    super(message, cause);
  }

  readonly statusCode = 500;
}
