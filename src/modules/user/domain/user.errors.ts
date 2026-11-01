import { AlreadyExistsException } from '#src/shared/exceptions/index.ts';

export class UserAlreadyExistsError extends AlreadyExistsException {
  override readonly reason = 'USER_ALREADY_EXISTS';

  constructor(cause?: Error) {
    super('User already exists', cause);
  }
}
