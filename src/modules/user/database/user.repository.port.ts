import { UserEntity } from '@/modules/user/domain/user.types';
import { RepositoryPort } from '@/shared/db/repository.port';

export interface UserRepository extends RepositoryPort<UserEntity> {
  findOneByEmail(email: string): Promise<UserEntity | undefined>;
}
