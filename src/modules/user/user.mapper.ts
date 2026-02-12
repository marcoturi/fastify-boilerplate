import { type UserModel, userSchema } from '#src/modules/user/database/user.repository.ts';
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import type { UserResponseDto } from '#src/modules/user/dtos/user.response.dto.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';
import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { ajv } from '#src/shared/utils/validator.util.ts';

export default function userMapper(): Mapper<UserEntity, UserModel, UserResponseDto> {
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
