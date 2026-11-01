import { userActionCreator } from '#src/modules/user/index.ts';
import { NotFoundException } from '#src/shared/exceptions/index.ts';

export const deleteUserCommand = userActionCreator<{ id: string }, boolean>('delete');

export default function deleteUserHandler({ userRepository, commandBus }: Dependencies) {
  return {
    init() {
      commandBus.register(deleteUserCommand, async ({ payload }) => {
        const deleted = await userRepository.delete(payload.id);
        if (!deleted) {
          throw new NotFoundException(`User with id ${payload.id} not found`);
        }
        return deleted;
      });
    },
  };
}
