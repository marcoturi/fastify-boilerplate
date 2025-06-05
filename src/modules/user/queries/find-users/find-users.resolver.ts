import { findUsersQuery, FindUsersQueryResult } from './find-users.handler';

export default async function findUsersResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Query: {
      findUsers: async (_, args) => {
        return await fastify.queryBus.execute<FindUsersQueryResult>(
          findUsersQuery(args ?? {}),
        );
      },
    },
  });
}
