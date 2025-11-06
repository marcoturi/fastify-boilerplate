import {
  createUserCommand,
  CreateUserCommandResult,
} from '@/modules/user/commands/create-user/create-user.handler';
import { createUserRequestDtoSchema } from '@/modules/user/commands/create-user/create-user.schema';
import { idDtoSchema } from '@/shared/api/id.response.dto';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export default async function createUser(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'POST',
    url: '/v1/users',
    schema: {
      description: 'Create user',
      body: createUserRequestDtoSchema,
      response: {
        201: idDtoSchema,
      },
      tags: ['users'],
    },
    handler: async (req, res) => {
      const id = await fastify.commandBus.execute<CreateUserCommandResult>(
        createUserCommand(req.body),
      );
      return res.status(201).send({ id });
    },
  });
}
