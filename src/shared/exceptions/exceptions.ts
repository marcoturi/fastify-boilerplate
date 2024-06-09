import { ExceptionBase } from './exception-base';

/**
 * Used to indicate that an incorrect argument was provided to a method/function/class constructor
 *
 * @class ArgumentInvalidException
 * @extends {ExceptionBase}
 */
export class ArgumentInvalidException extends ExceptionBase {
  readonly statusCode = 400;
  readonly error = 'Bad Request';
}

/**
 * Used to indicate conflicting entities (usually in the database)
 *
 * @class ConflictException
 * @extends {ExceptionBase}
 */
export class ConflictException extends ExceptionBase {
  readonly error = 'Conflict';
  readonly statusCode = 409;
}

/**
 * Used to indicate that entity is not found
 *
 * @class NotFoundException
 * @extends {ExceptionBase}
 */
export class NotFoundException extends ExceptionBase {
  static readonly message = 'Not found';
  readonly error = 'Not Found';
  readonly statusCode = 404;

  constructor(message = NotFoundException.message) {
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
  static readonly message = 'Internal server error';
  readonly error = 'Internal server error';
  constructor(message = InternalServerErrorException.message) {
    super(message);
  }

  readonly statusCode = 500;
}

export class DatabaseErrorException extends ExceptionBase {
  static readonly message = 'Database error';
  readonly error = 'Internal server error';
  constructor(message = InternalServerErrorException.message, cause?: Error) {
    super(message, cause);
  }

  readonly statusCode = 500;
}
