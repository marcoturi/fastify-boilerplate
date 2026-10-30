import mercurius from 'mercurius';
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
          throw new mercurius.ErrorWithProps(ajv.errorsText(validateArgs.errors), {
            code: 'BAD_USER_INPUT',
          });
        }
        return await fastify.queryBus.execute(findUsersQuery(args));
      },
    },
  });
}
