import { AlreadyExistsException } from '#src/shared/exceptions/index.ts';

export class UserAlreadyExistsError extends AlreadyExistsException {
  static readonly message = 'User already exists';
  override readonly reason = 'USER_ALREADY_EXISTS';

  constructor(cause?: Error, metadata?: unknown) {
    super(UserAlreadyExistsError.message, cause, metadata);
  }
}
