import type { CommandBus } from '#src/shared/cqrs/bus.types.ts';
import { requestBus } from '#src/shared/cqrs/request-bus.ts';

export function commandBus(): CommandBus {
  return requestBus('Command');
}
