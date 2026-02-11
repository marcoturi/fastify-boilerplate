import { ConflictException } from '@/shared/exceptions/index';

export class UserAlreadyExistsError extends ConflictException {
  static readonly message = 'User already exists';

  constructor(cause?: Error, metadata?: unknown) {
    super(UserAlreadyExistsError.message, cause, metadata);
  }
}
