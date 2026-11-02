import { idDtoSchema } from '#src/shared/api/id.response.dto.ts';
import { validator } from '#src/shared/utils/validator.util.ts';
import { deleteUserCommand } from './delete-user.handler.ts';

// Same schema as the REST route: the ID scalar accepts any string, the route only a UUID
const validateArgs = validator(idDtoSchema);

export default async function deleteUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      deleteUser: async (_, args) =>
        fastify.commandBus.execute(deleteUserCommand({ id: validateArgs(args).id })),
    },
  });
}
