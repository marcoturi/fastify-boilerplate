import { validator } from '#src/shared/utils/validator.util.ts';
import { createUserCommand } from './create-user.handler.ts';
import { createUserRequestDtoSchema } from './create-user.schema.ts';

const validateInput = validator(createUserRequestDtoSchema);

export default async function createUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      createUser: async (_, args) =>
        fastify.commandBus.execute(createUserCommand(validateInput(args.input))),
    },
  });
}
