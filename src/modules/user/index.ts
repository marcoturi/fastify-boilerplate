import type { UserModel } from '@/modules/user/database/user.repository';
import type { UserRepository } from '@/modules/user/database/user.repository.port';
import type userDomain from '@/modules/user/domain/user.domain';
import type { UserEntity } from '@/modules/user/domain/user.types';
import type { UserResponseDto } from '@/modules/user/dtos/user.response.dto';
import { actionCreatorFactory } from '@/shared/cqrs/action-creator';
import type { Mapper } from '@/shared/ddd/mapper.interface';

declare global {
  export interface Dependencies {
    userMapper: Mapper<UserEntity, UserModel, UserResponseDto>;
    userRepository: UserRepository;
    userDomain: ReturnType<typeof userDomain>;
  }
}

export const userActionCreator = actionCreatorFactory('user');
