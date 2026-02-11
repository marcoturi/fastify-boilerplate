import {
  findUsersQuery,
  type FindUsersQueryResult,
} from './find-users.handler.ts';
import { findUsersRequestDtoSchema } from './find-users.schema.ts';
import { userPaginatedResponseSchema } from '@/modules/user/dtos/user.paginated.response.dto';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export default async function findUsers(fastify: FastifyRouteInstance) {
  fastify.withTypeProvider<TypeBoxTypeProvider>().route({
    method: 'GET',
    url: '/v1/users',
    schema: {
      description: 'Find users',
      querystring: findUsersRequestDtoSchema,
      response: {
        200: userPaginatedResponseSchema,
      },
      tags: ['users'],
    },
    handler: async (req, res) => {
      const result = await fastify.queryBus.execute<FindUsersQueryResult>(
        findUsersQuery(req.query),
      );
      const response = {
        ...result,
        data: result.data?.map(
          fastify.diContainer.cradle.userMapper.toResponse,
        ),
      };
      return res.status(200).send(response);
    },
  });
}
