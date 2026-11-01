import { createUserEvent } from '#src/modules/user/domain/user.events.ts';

export default function createSettingsEventHandler({ eventBus, logger }: Dependencies) {
  return {
    init() {
      eventBus.on(createUserEvent, ({ payload }) => {
        // Log only the id — the event payload carries PII (email, address).
        logger.info({ userId: payload.id }, 'Creating default settings for user');
        // todo: add some logic here to create default settings for the user
      });
    },
  };
}
