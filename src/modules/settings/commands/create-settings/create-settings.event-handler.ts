import { createUserEvent } from '#src/modules/user/domain/user.events.ts';

export default function makeCreateSettings({ eventBus, logger }: Dependencies) {
  return {
    handler(action: ReturnType<typeof createUserEvent>) {
      // Log only the id — the event payload carries PII (email, address).
      logger.info({ userId: action.payload.id }, 'Creating default settings for user');
      // todo: add some logic here to create default settings for the user
    },
    init() {
      eventBus.on(createUserEvent.type, this.handler);
    },
  };
}
