---
paths:
  - "src/modules/**/*.{route,resolver,schema,graphql-schema}.ts"
  - "src/modules/**/dtos/**"
  - "src/shared/api/**"
  - "src/shared/exceptions/**"
  - "src/shared/utils/validator.util.ts"
  - "src/server/**"
---

# API (REST and GraphQL)

- All REST routes are prefixed with `/api` (configured in `src/server/index.ts`)
- Schemas use TypeBox (`Type.Object`, `Type.String`, etc.); shared response schemas live in `src/shared/api/`
- Routes and resolvers handle transport concerns only — no business logic; they dispatch to the
  CQRS buses (see the CQRS rule)
- GraphQL resolvers co-locate with their REST route counterparts (`<slice>.route.ts`,
  `<slice>.resolver.ts`, `<slice>.graphql-schema.ts` in the same folder)
- A slice adds its root fields with `extend type Query` / `extend type Mutation`: the root types
  are declared once, in `src/server/graphql-schema.ts`

## GraphQL input validation

GraphQL types only check that fields are present and have the right scalar type. Resolvers must
validate their input against the same TypeBox schema as the REST route with `validator(schema)`
(`src/shared/utils/validator.util.ts`, on the shared Ajv instance). It returns the input typed by
the schema, or throws an `ArgumentInvalidException` with a sub-error for the invalid field, as REST
reports it. Validation stops at the first invalid field, on both transports: Ajv's `allErrors`
would let a crafted request cost more CPU.

```typescript
const validateInput = validator(createUserRequestDtoSchema);

createUser: async (_, args) =>
  fastify.commandBus.execute(createUserCommand(validateInput(args.input))),
```

## Errors

Handlers and resolvers throw exceptions with a transport-neutral `code` (see AGENTS.md) and do
not catch them to translate them. The translation happens once per transport, in a map from
`ErrorCode`: `httpStatusByCode` in `src/server/plugins/error-handler.ts` (REST status) and
`graphqlCodeByCode` in `src/server/graphql-error-formatter.ts` (GraphQL `extensions.code`).
On both, `INTERNAL` and unknown errors are logged and their message hidden, and the errors of
Fastify and its plugins (malformed JSON, body too large, under-pressure) keep their HTTP status.

An exception's `reason`, when set (e.g. `USER_ALREADY_EXISTS`), is the `reason` field of the REST
error body and replaces the generic code on GraphQL. The `subErrors` of an `ArgumentInvalidException`
(`{ path, message }` of the invalid field) go in the REST body and in GraphQL `extensions.subErrors`.
A new transport (e.g. gRPC) adds its own table instead of changing the exceptions.
