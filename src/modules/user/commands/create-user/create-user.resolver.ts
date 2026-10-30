import mercurius from 'mercurius';
import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { ajv } from '#src/shared/utils/validator.util.ts';
import { createUserCommand } from './create-user.handler.ts';
import { type CreateUserRequestDto, createUserRequestDtoSchema } from './create-user.schema.ts';

// Same schema as the REST route: GraphQL types only check presence and scalar types,
// so formats and lengths (e.g. email) are enforced here.
const validateInput = ajv.compile<CreateUserRequestDto>(createUserRequestDtoSchema);

export default async function createUserResolver(fastify: FastifyRouteInstance) {
  fastify.graphql.defineResolvers({
    Mutation: {
      putUser: async (_, args) => {
        if (!validateInput(args.input)) {
          throw new mercurius.ErrorWithProps(ajv.errorsText(validateInput.errors), {
            code: 'BAD_USER_INPUT',
          });
        }
        try {
          return await fastify.commandBus.execute(createUserCommand(args.input));
        } catch (error) {
          if (error instanceof UserAlreadyExistsError) {
            throw new mercurius.ErrorWithProps(error.message, {
              code: 'USER_ALREADY_EXISTS',
              timestamp: Math.round(Date.now() / 1000),
            });
          }
          throw error;
        }
      },
    },
  });
}
