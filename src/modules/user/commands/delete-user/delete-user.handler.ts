import { userActionCreator } from '#src/modules/user/index.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type DeleteUserCommandResult = Promise<boolean>;
export const deleteUserCommand = userActionCreator<{ id: string }>('delete');

export default function makeDeleteUser({ userRepository, commandBus }: Dependencies) {
  return {
    async handler({ payload }: ReturnType<typeof deleteUserCommand>): DeleteUserCommandResult {
      const deleted = await userRepository.delete(payload.id);
      if (!deleted) {
        throw new NotFoundException();
      }
      return deleted;
    },
    init() {
      commandBus.register(deleteUserCommand.type, this.handler);
    },
  };
}
