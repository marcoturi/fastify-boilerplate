import {
  type UserModel,
  userSchema,
} from '@/modules/user/database/user.repository';
import type { UserEntity } from '@/modules/user/domain/user.types';
import type { UserResponseDto } from '@/modules/user/dtos/user.response.dto';
import type { Mapper } from '@/shared/ddd/mapper.interface';
import { ArgumentInvalidException } from '@/shared/exceptions/index';
import { ajv } from '@/shared/utils/validator.util';

export default function userMapper(): Mapper<
  UserEntity,
  UserModel,
  UserResponseDto
> {
  const persistenceValidator = ajv.compile(userSchema);
  return {
    toDomain(record: UserModel): UserEntity {
      return {
        id: record.id,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
        email: record.email,
        role: record.role,
        street: record.street,
        postalCode: record.postalCode,
        country: record.country,
      };
    },
    toResponse(entity: UserEntity): UserResponseDto {
      return {
        ...entity,
        updatedAt: entity.updatedAt.toISOString(),
        createdAt: entity.createdAt.toISOString(),
      };
    },
    toPersistence(user: UserEntity): UserModel {
      const record: UserModel = {
        id: user.id,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        email: user.email,
        country: user.country,
        postalCode: user.postalCode,
        street: user.street,
        role: user.role,
      };
      const validate = persistenceValidator(record);
      if (!validate) {
        throw new ArgumentInvalidException(
          JSON.stringify(persistenceValidator.errors),
          new Error('Mapper Validation error'),
          record,
        );
      }
      return record;
    },
  };
}
