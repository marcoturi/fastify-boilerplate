import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://127.0.0.1:3000/graphql',
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
