import { userActionCreator } from '#src/modules/user/user.action-creator.ts';
import type { UserEntity } from './user.types.ts';

export const createUserEvent = userActionCreator<UserEntity>('created');
