import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

/** Module-level action creator (prefix `user/`). Kept in a neutral, layer-free file so the
 *  domain can create its own events without importing from `index.ts` (which would form a
 *  domain↔index cycle) or from the application layer. */
export const userActionCreator = actionCreatorFactory('user');
