import {
  deleteUserCommand,
  DeleteUserCommandResult,
} from '@/modules/user/commands/delete-user/delete-user.handler';
import { FastifyReplyTypebox, FastifyRequestTypebox } from '@/server';
import { idDtoSchema } from '@/shared/api/id.response.dto';

export default async function deleteUser(fastify: FastifyRouteInstance) {
  const schema = {
    description: 'Delete a user',
    params: idDtoSchema,
    response: {
      204: {
        type: 'null',
        description: 'User Deleted',
      },
    },
    tags: ['users'],
  };
  fastify.route({
    method: 'DELETE',
    url: '/v1/users/:id',
    schema,
    handler: async (
      req: FastifyRequestTypebox<typeof schema>,
      res: FastifyReplyTypebox<typeof schema>,
    ) => {
      try {
        await fastify.commandBus.execute<DeleteUserCommandResult>(
          deleteUserCommand({ id: req.params.id }),
        );
        return res.status(204).send();
      } catch (error) {
        throw error;
      }
    },
  });
}
