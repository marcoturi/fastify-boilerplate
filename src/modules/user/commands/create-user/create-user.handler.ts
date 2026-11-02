import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { createUserEvent } from '#src/modules/user/domain/user.events.ts';
import { userActionCreator } from '#src/modules/user/user.action-creator.ts';
import { AlreadyExistsException } from '#src/shared/exceptions/index.ts';
import type { CreateUserRequestDto } from './create-user.schema.ts';

export const createUserCommand = userActionCreator<CreateUserRequestDto, string>('create');

export default function createUserHandler({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    init() {
      commandBus.register(createUserCommand, async ({ payload }) => {
        const user = userDomain.createUser(payload);
        try {
          await userRepository.insert(user);
        } catch (error: unknown) {
          if (error instanceof AlreadyExistsException) {
            throw new UserAlreadyExistsError(error);
          }
          throw error;
        }
        eventBus.emit(createUserEvent(user)); // only once the write has succeeded
        return user.id;
      });
    },
  };
}
