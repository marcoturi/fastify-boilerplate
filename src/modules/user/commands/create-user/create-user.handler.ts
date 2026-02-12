import type { CreateUserRequestDto } from './create-user.schema.ts';
import { userActionCreator } from '#src/modules/user/index.ts';
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { ConflictException } from '#src/shared/exceptions/index.ts';

export type CreateUserCommandResult = Promise<string>;
export const createUserCommand = userActionCreator<CreateUserRequestDto>('create');
export const createUserEvent = userActionCreator<UserEntity>('created');

export default function makeCreateUser({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    async handler({ payload }: ReturnType<typeof createUserCommand>): CreateUserCommandResult {
      const user = userDomain.createUser(payload);
      try {
        await userRepository.insert(user);
        eventBus.emit(createUserEvent(user));
        return user.id;
      } catch (error: unknown) {
        if (error instanceof ConflictException) {
          throw new UserAlreadyExistsError(error);
        }
        throw error;
      }
    },
    init() {
      commandBus.register(createUserCommand.type, this.handler);
    },
  };
}
