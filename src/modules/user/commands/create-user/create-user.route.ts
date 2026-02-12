import {
  createUserCommand,
  type CreateUserCommandResult,
} from '#src/modules/user/commands/create-user/create-user.handler.ts';
import { createUserRequestDtoSchema } from '#src/modules/user/commands/create-user/create-user.schema.ts';
import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

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
