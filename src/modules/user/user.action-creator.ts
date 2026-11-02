import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';

/** Module-level action creator (prefix `user/`), imported by the handlers and the domain
 *  events from this layer-free file */
export const userActionCreator = actionCreatorFactory('user');
