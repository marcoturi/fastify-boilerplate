import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { apiErrorResponseRef } from '#src/shared/api/api-error.response.ts';
import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import { deleteUserCommand } from './delete-user.handler.ts';

export default async function deleteUser(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/users/:id',
    schema: {
      description: 'Delete a user',
      params: idDtoSchema,
      response: {
        204: {
          type: 'null',
          description: 'User Deleted',
        },
        // 400/500 come from the shared 4XX/5XX error responses (see swagger plugin).
        // 404 is declared explicitly because clients special-case a missing user.
        404: apiErrorResponseRef,
      },
      tags: ['users'],
    },
    handler: async (req, res) => {
      await fastify.commandBus.execute(deleteUserCommand({ id: req.params.id }));
      return res.status(204).send(null);
    },
  });
}
