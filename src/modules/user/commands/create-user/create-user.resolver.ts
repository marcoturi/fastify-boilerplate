import {
  createUserCommand,
  CreateUserCommandResult,
} from './create-user.handler';
import { UserAlreadyExistsError } from '@/modules/user/domain/user.errors';
import { ErrorWithProps } from 'mercurius';

export default async function createUserResolver(
  fastify: FastifyRouteInstance,
) {
  fastify.graphql.defineResolvers({
    Mutation: {
      putUser: async (_, args) => {
        try {
          const id = await fastify.commandBus.execute<CreateUserCommandResult>(
            createUserCommand(args.user || {}),
          );
          return id;
        } catch (error) {
          if (error instanceof UserAlreadyExistsError) {
            throw new ErrorWithProps(error.message, {
              code: 'USER_ALREADY_EXISTS',
              timestamp: Math.round(Date.now() / 1000),
            });
          }
          throw error;
        }
      },
    },
  });
}
