import {
  createUserCommand,
  createUserEvent,
} from '@/modules/user/commands/create-user/create-user.handler';

export default function makeCreateSettings({ eventBus, logger }: Dependencies) {
  return {
    handler(action: ReturnType<typeof createUserEvent>) {
      logger.info(action);
      // todo: add some logic here to create default settings for the user
    },
    init() {
      eventBus.on(createUserCommand.type, this.handler);
    },
  };
}
