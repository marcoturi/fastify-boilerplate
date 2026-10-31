import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { ajv } from '#src/shared/utils/validator.util.ts';
import { deleteUserCommand } from './delete-user.handler.ts';

// Same schema as the REST route: the ID scalar accepts any string, the route only a UUID
const validateArgs = ajv.compile<{ id: string }>(idDtoSchema);

export default async function deleteUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      // A missing user is a NOT_FOUND error, as on REST
      deleteUser: async (_, args) => {
        if (!validateArgs(args)) {
          throw new ArgumentInvalidException(ajv.errorsText(validateArgs.errors));
        }
        return await fastify.commandBus.execute(deleteUserCommand({ id: args.id }));
      },
    },
  });
}
