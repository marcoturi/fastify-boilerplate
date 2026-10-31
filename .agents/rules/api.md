---
paths:
  - "src/modules/**/*.{route,resolver,schema,graphql-schema}.ts"
  - "src/modules/**/dtos/**"
  - "src/shared/api/**"
  - "src/shared/exceptions/**"
  - "src/server/**"
---

# API (REST and GraphQL)

- All REST routes are prefixed with `/api` (configured in `src/server/index.ts`)
- Schemas use TypeBox (`Type.Object`, `Type.String`, etc.); shared response schemas live in `src/shared/api/`
- Routes and resolvers handle transport concerns only — no business logic; they dispatch to the
  CQRS buses (see the CQRS rule)
- GraphQL resolvers co-locate with their REST route counterparts (`<slice>.route.ts`,
  `<slice>.resolver.ts`, `<slice>.graphql-schema.ts` in the same folder)

## GraphQL input validation

GraphQL types only check that fields are present and have the right scalar type. Resolvers must
validate their input against the same TypeBox schema as the REST route, through the shared Ajv
instance (`src/shared/utils/validator.util.ts`), and throw an `ArgumentInvalidException` when it fails:

```typescript
const validateInput = ajv.compile<CreateUserRequestDto>(createUserRequestDtoSchema);

if (!validateInput(args.input)) {
  throw new ArgumentInvalidException(ajv.errorsText(validateInput.errors));
}
```

## Errors

Handlers and resolvers throw exceptions with a transport-neutral `code` (see AGENTS.md) and do
not catch them to translate them. The translation happens once per transport:

| `ErrorCode` | REST (`src/server/plugins/error-handler.ts`) | GraphQL `extensions.code` (`src/server/graphql-error-formatter.ts`) |
|---|---|---|
| `INVALID_ARGUMENT` | 400 | `BAD_USER_INPUT` |
| `NOT_FOUND` | 404 | `NOT_FOUND` |
| `ALREADY_EXISTS` | 409 | `ALREADY_EXISTS` |
| `INTERNAL` and unknown errors | 500, message hidden | `INTERNAL_SERVER_ERROR`, message hidden |

On GraphQL an exception's `reason`, when set, replaces the generic code (e.g. `USER_ALREADY_EXISTS`).
A new transport (e.g. gRPC) adds its own table instead of changing the exceptions.
