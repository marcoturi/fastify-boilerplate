import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
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
      },
      tags: ['users'],
    },
    handler: async (req, res) => {
      await fastify.commandBus.execute(deleteUserCommand({ id: req.params.id }));
      return res.status(204).send(null);
    },
  });
}
