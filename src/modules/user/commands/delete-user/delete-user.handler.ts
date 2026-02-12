import { userActionCreator } from '#src/modules/user/index.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export type DeleteUserResult = boolean;
export const deleteUserCommand = userActionCreator<{ id: string }, DeleteUserResult>('delete');

export default function makeDeleteUser({ userRepository, commandBus }: Dependencies) {
  return {
    async handler({ payload }: HandlerAction<typeof deleteUserCommand>): Promise<DeleteUserResult> {
      const deleted = await userRepository.delete(payload.id);
      if (!deleted) {
        throw new NotFoundException(`User with id ${payload.id} not found`);
      }
      return deleted;
    },
    init() {
      commandBus.register(deleteUserCommand.type, this.handler);
    },
  };
}
