import type { QueryBus } from '#src/shared/cqrs/bus.types.ts';
import { createRequestBus } from '#src/shared/cqrs/request-bus.ts';

export function queryBus(): QueryBus {
  return createRequestBus('Query');
}
