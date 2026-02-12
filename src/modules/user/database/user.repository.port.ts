import type { UserEntity } from '@/modules/user/domain/user.types';
import type { RepositoryPort } from '@/shared/db/repository.port';

export interface UserRepository extends RepositoryPort<UserEntity> {
  findOneByEmail(email: string): Promise<UserEntity | undefined>;
}
