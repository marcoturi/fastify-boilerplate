import {
  findUsersQuery,
  FindUsersQueryResult,
} from '@/modules/user/queries/find-users/find-users.handler';

export default async function findUsersResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Query: {
      findUsers: async (_, args) => {
        const result = await fastify.queryBus.execute<FindUsersQueryResult>(
          findUsersQuery(args || {}),
        );
        return result;
      },
    },
  });
}
