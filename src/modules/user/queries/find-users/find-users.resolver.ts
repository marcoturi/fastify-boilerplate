import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { ajv } from '#src/shared/utils/validator.util.ts';
import { findUsersQuery } from './find-users.handler.ts';
import { type FindUsersRequestDto, findUsersRequestDtoSchema } from './find-users.schema.ts';

// Same schema as the REST route: GraphQL types do not check ranges, patterns or lengths,
// and accept explicit nulls (e.g. `limit: null`).
const validateArgs = ajv.compile<FindUsersRequestDto>(findUsersRequestDtoSchema);

export default async function findUsersResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Query: {
      findUsers: async (_, args) => {
        if (!validateArgs(args)) {
          throw new ArgumentInvalidException(ajv.errorsText(validateArgs.errors));
        }
        const result = await fastify.queryBus.execute(findUsersQuery(args));
        return {
          ...result,
          data: result.data.map(fastify.diContainer.cradle.userMapper.toResponse),
        };
      },
    },
  });
}
