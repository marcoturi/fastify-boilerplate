import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  // Set by generate-types.sh, which starts the server
  schema: `${process.env.SERVER_URL}/graphql`,
  generates: {
    './client/graphql.ts': {
      plugins: ['typescript'],
      // Union types instead of TypeScript enums: an enum is not erasable syntax, so Node's
      // type stripping could not load the file
      config: { enumsAsTypes: true },
    },
  },
};

export default config;
