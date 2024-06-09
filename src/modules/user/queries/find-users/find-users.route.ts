import { userPaginatedResponseSchema } from '@/modules/user/dtos/user.paginated.response.dto';
import {
  FindUsersQueryResult,
  findUsersQuery,
} from '@/modules/user/queries/find-users/find-users.handler';
import { findUsersRequestDtoSchema } from '@/modules/user/queries/find-users/find-users.schema';
import { FastifyReplyTypebox, FastifyRequestTypebox } from '@/server';

export default async function findUsers(fastify: FastifyRouteInstance) {
  const schema = {
    description: 'Find users',
    querystring: findUsersRequestDtoSchema,
    response: {
      200: userPaginatedResponseSchema,
    },
    tags: ['users'],
  };
  fastify.route({
    method: 'GET',
    url: '/v1/users',
    schema,
    handler: async (
      req: FastifyRequestTypebox<typeof schema>,
      res: FastifyReplyTypebox<typeof schema>,
    ) => {
      const result = await fastify.queryBus.execute<FindUsersQueryResult>(
        findUsersQuery(req.query),
      );
      return res.status(200).send(result);
    },
  });
}
