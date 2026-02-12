import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import mercurius from 'mercurius';
import { createUserCommand } from './create-user.handler.ts';

export default async function createUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      putUser: async (_, args) => {
        try {
          return await fastify.commandBus.execute(createUserCommand(args.input ?? {}));
        } catch (error) {
          if (error instanceof UserAlreadyExistsError) {
            throw new mercurius.ErrorWithProps(error.message, {
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
