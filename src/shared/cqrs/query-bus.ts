import type { QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { requestBus } from '#src/shared/cqrs/request-bus.ts';

export function queryBus(): QueryBus {
  return requestBus('Query');
}
