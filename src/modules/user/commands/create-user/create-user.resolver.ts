import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { ajv } from '#src/shared/utils/validator.util.ts';
import { createUserCommand } from './create-user.handler.ts';
import { type CreateUserRequestDto, createUserRequestDtoSchema } from './create-user.schema.ts';

// Same schema as the REST route: GraphQL types only check presence and scalar types,
// so formats and lengths (e.g. email) are enforced here.
const validateInput = ajv.compile<CreateUserRequestDto>(createUserRequestDtoSchema);

export default async function createUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      // Exceptions become GraphQL error codes in the error formatter (BAD_USER_INPUT,
      // USER_ALREADY_EXISTS, ...), so the resolver does not catch them
      putUser: async (_, args) => {
        if (!validateInput(args.input)) {
          throw new ArgumentInvalidException(ajv.errorsText(validateInput.errors));
        }
        return await fastify.commandBus.execute(createUserCommand(args.input));
      },
    },
  });
}
