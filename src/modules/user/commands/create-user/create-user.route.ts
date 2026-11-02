import { apiErrorResponseRef } from '#src/shared/api/api-error.response.ts';
import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import { createUserCommand } from './create-user.handler.ts';
import { createUserRequestDtoSchema } from './create-user.schema.ts';

export default async function createUserRoute(fastify: FastifyRouteInstance) {
  fastify.route({
    method: 'POST',
    url: '/v1/users',
    schema: {
      description: 'Create user',
      body: createUserRequestDtoSchema,
      response: {
        201: idDtoSchema,
        // 409 is declared explicitly because clients special-case "already exists".
        409: apiErrorResponseRef,
      },
      tags: ['users'],
    },
    handler: async (req, res) => {
      const id = await fastify.commandBus.execute(createUserCommand(req.body));
      return res.status(201).send({ id });
    },
  });
}
