import { userActionCreator } from '@/modules/user';
import { CreateUserRequestDto } from '@/modules/user/commands/create-user/create-user.schema';
import { UserAlreadyExistsError } from '@/modules/user/domain/user.errors';
import { ConflictException } from '@/shared/exceptions';

export type CreateUserCommandResult = Promise<string>;
export const createUserCommand =
  userActionCreator<CreateUserRequestDto>('create');
export const createUserEvent =
  userActionCreator<CreateUserRequestDto>('create');

export default function makeCreateUser({
  userRepository,
  userDomain,
  commandBus,
  eventBus,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: ReturnType<typeof createUserCommand>): CreateUserCommandResult {
      const user = userDomain.createUser(payload);
      try {
        await userRepository.insert(user);
        eventBus.emit(createUserEvent(user));
        return user.id;
      } catch (error: any) {
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
