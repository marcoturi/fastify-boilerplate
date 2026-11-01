import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { userActionCreator } from '#src/modules/user/index.ts';
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
        const created = userDomain.createUser(payload);
        try {
          await userRepository.insert(created.entity);
        } catch (error: unknown) {
          if (error instanceof AlreadyExistsException) {
            throw new UserAlreadyExistsError(error);
          }
          throw error;
        }
        await created.commit(eventBus); // publish recorded domain events after the write succeeds
        return created.entity.id;
      });
    },
  };
}
