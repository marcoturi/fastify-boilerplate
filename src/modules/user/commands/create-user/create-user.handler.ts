import type { CreateUserRequestDto } from './create-user.schema.ts';
import { userActionCreator } from '#src/modules/user/index.ts';
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { ConflictException } from '#src/shared/exceptions/index.ts';

export type CreateUserResult = string;
export const createUserCommand = userActionCreator<CreateUserRequestDto, CreateUserResult>(
  'create',
);
export const createUserEvent = userActionCreator<UserEntity>('created');

export default function makeCreateUser({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof createUserCommand>): Promise<CreateUserResult> {
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
