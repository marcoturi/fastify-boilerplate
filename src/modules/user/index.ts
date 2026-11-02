import type userRepository from '#src/modules/user/database/user.repository.ts';
import type userDomain from '#src/modules/user/domain/user.domain.ts';
import type userMapper from '#src/modules/user/user.mapper.ts';

declare global {
  export interface Dependencies {
    userMapper: ReturnType<typeof userMapper>;
    userRepository: ReturnType<typeof userRepository>;
    userDomain: ReturnType<typeof userDomain>;
  }
}
