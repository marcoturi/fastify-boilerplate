import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import type { RepositoryPort } from '#src/shared/db/repository.port.ts';

export interface UserRepository extends RepositoryPort<UserEntity> {
  findOneByEmail(email: string): Promise<UserEntity | undefined>;
}
