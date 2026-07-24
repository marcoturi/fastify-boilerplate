import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { userActionCreator } from '#src/modules/user/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { ConflictException } from '#src/shared/exceptions/index.ts';
import type { CreateUserRequestDto } from './create-user.schema.ts';

export type CreateUserResult = string;
export const createUserCommand = userActionCreator<CreateUserRequestDto, CreateUserResult>(
  'create',
);

export default function makeCreateUser({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof createUserCommand>): Promise<CreateUserResult> {
      const created = userDomain.createUser(payload);
      const user = created.entity;
      try {
        await userRepository.insert(user);
        await created.commit(eventBus); // publish recorded domain events after the write succeeds
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
