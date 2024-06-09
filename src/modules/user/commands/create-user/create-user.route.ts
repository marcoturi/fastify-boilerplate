import {
  createUserCommand,
  CreateUserCommandResult,
} from '@/modules/user/commands/create-user/create-user.handler';
import { createUserRequestDtoSchema } from '@/modules/user/commands/create-user/create-user.schema';
import { UserAlreadyExistsError } from '@/modules/user/domain/user.errors';
import { FastifyReplyTypebox, FastifyRequestTypebox } from '@/server';
import { idDtoSchema } from '@/shared/api/id.response.dto';
import { ConflictException } from '@/shared/exceptions';

export default async function createUser(fastify: FastifyRouteInstance) {
  const schema = {
    description: 'Create user',
    body: createUserRequestDtoSchema,
    response: {
      200: idDtoSchema,
    },
    tags: ['users'],
  };
  fastify.route({
    method: 'POST',
    url: '/v1/users',
    schema,
    handler: async (
      req: FastifyRequestTypebox<typeof schema>,
      res: FastifyReplyTypebox<typeof schema>,
    ) => {
      try {
        const id = await fastify.commandBus.execute<CreateUserCommandResult>(
          createUserCommand(req.body),
        );
        return res.status(200).send({ id });
      } catch (error) {
        if (error instanceof UserAlreadyExistsError) {
          throw new ConflictException(error.message);
        }
        throw error;
      }
    },
  });
}
