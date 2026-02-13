import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://127.0.0.1:3000/graphql',
  generates: {
    './client/graphql.ts': {
      plugins: ['typescript'],
    },
  },
};

export default config;
