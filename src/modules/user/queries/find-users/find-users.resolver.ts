import { findUsersQuery } from './find-users.handler.ts';

export default async function findUsersResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Query: {
      findUsers: async (_, args) => {
        return await fastify.queryBus.execute(findUsersQuery(args ?? {}));
      },
    },
  });
}
