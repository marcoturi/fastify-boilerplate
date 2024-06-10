import {
  createUserCommand,
  CreateUserCommandResult,
} from '@/modules/user/commands/create-user/create-user.handler';
import { createUserRequestDtoSchema } from '@/modules/user/commands/create-user/create-user.schema';
import { FastifyReplyTypebox, FastifyRequestTypebox } from '@/server';
import { idDtoSchema } from '@/shared/api/id.response.dto';

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
      const id = await fastify.commandBus.execute<CreateUserCommandResult>(
        createUserCommand(req.body),
      );
      return res.status(200).send({ id });
    },
  });
}
