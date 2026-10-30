---
paths:
  - "src/modules/**/*.{route,resolver,schema,graphql-schema}.ts"
  - "src/modules/**/dtos/**"
  - "src/shared/api/**"
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
instance (`src/shared/utils/validator.util.ts`), and return a `BAD_USER_INPUT` error when it fails:

```typescript
const validateInput = ajv.compile<CreateUserRequestDto>(createUserRequestDtoSchema);

if (!validateInput(args.input)) {
  throw new mercurius.ErrorWithProps(ajv.errorsText(validateInput.errors), { code: 'BAD_USER_INPUT' });
}
```

Map domain errors to `mercurius.ErrorWithProps` with a stable `code` in `extensions`
(e.g. `USER_ALREADY_EXISTS`), so clients can tell errors apart.
