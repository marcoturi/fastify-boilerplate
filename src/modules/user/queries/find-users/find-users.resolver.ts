import { mapPage } from '#src/shared/api/paginated.response.base.ts';
import { validator } from '#src/shared/utils/validator.util.ts';
import { findUsersQuery } from './find-users.handler.ts';
import { findUsersRequestDtoSchema } from './find-users.schema.ts';

// Same schema as the REST route: GraphQL types do not check ranges, patterns or lengths
const validateArgs = validator(findUsersRequestDtoSchema);

export default async function findUsersResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Query: {
      findUsers: async (_, args) => {
        const result = await fastify.queryBus.execute(findUsersQuery(validateArgs(args)));
        return mapPage(result, fastify.diContainer.cradle.userMapper.toResponse);
      },
    },
  });
}
