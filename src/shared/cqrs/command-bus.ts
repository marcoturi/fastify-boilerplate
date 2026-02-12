import type { CommandBus } from '#src/shared/cqrs/bus.types.ts';
import { createRequestBus } from '#src/shared/cqrs/request-bus.ts';

export function commandBus(): CommandBus {
  return createRequestBus('Command');
}
