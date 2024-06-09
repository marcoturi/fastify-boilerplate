import { UserModel } from '@/modules/user/database/user.repository';
import { UserRepository } from '@/modules/user/database/user.repository.port';
import userDomain from '@/modules/user/domain/user.domain';
import { UserEntity } from '@/modules/user/domain/user.types';
import { UserResponseDto } from '@/modules/user/dtos/user.response.dto';
import { actionCreatorFactory } from '@/shared/cqrs/action-creator';
import { Mapper } from '@/shared/ddd/mapper.interface';

declare global {
  export interface Dependencies {
    userMapper: Mapper<UserEntity, UserModel, UserResponseDto>;
    userRepository: UserRepository;
    userDomain: ReturnType<typeof userDomain>;
  }
}

export const userActionCreator = actionCreatorFactory('user');
