import { userActionCreator } from '@/modules/user/index';
import { NotFoundException } from '@/shared/exceptions/index';

export type DeleteUserCommandResult = Promise<boolean>;
export const deleteUserCommand = userActionCreator<{ id: string }>('delete');

export default function makeDeleteUser({
  userRepository,
  commandBus,
}: Dependencies) {
  return {
    async handler({
      payload,
    }: ReturnType<typeof deleteUserCommand>): DeleteUserCommandResult {
      const user = await userRepository.findOneById(payload.id);
      if (!user) {
        throw new NotFoundException();
      }
      return await userRepository.delete(payload.id);
    },
    init() {
      commandBus.register(deleteUserCommand.type, this.handler);
    },
  };
}
