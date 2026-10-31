import { createUserEvent } from '#src/modules/user/domain/user.events.ts';
import type { HandlerAction } from '#src/shared/cqrs/bus.types.ts';

export default function createSettingsEventHandler({ eventBus, logger }: Dependencies) {
  return {
    handler(action: HandlerAction<typeof createUserEvent>) {
      // Log only the id — the event payload carries PII (email, address).
      logger.info({ userId: action.payload.id }, 'Creating default settings for user');
      // todo: add some logic here to create default settings for the user
    },
    init() {
      eventBus.on(createUserEvent.type, this.handler);
    },
  };
}
