import { userResponseDtoSchema } from '#src/modules/user/dtos/user.response.dto.ts';
import { mapPage, paginatedResponseSchema } from '#src/shared/api/paginated.response.base.ts';
import { findUsersQuery } from './find-users.handler.ts';
import { findUsersRequestDtoSchema } from './find-users.schema.ts';

export default async function findUsersRoute(fastify: FastifyRouteInstance) {
  fastify.route({
    method: 'GET',
    url: '/v1/users',
    schema: {
      description: 'Find users',
      querystring: findUsersRequestDtoSchema,
      response: {
        200: paginatedResponseSchema(userResponseDtoSchema),
      },
      tags: ['users'],
    },
    handler: async (req) => {
      const result = await fastify.queryBus.execute(findUsersQuery(req.query));
      return mapPage(result, fastify.diContainer.cradle.userMapper.toResponse);
    },
  });
}
