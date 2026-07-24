import { userActionCreator } from '#src/modules/user/user.action-creator.ts';
import type { UserEntity } from './user.types.ts';

/** Emitted when a user is created. Owned by the domain; published by the command handler
 *  after persistence. Event creators carry no `Result` generic (events return nothing). */
export const createUserEvent = userActionCreator<UserEntity>('created'); // type: 'user/created'
