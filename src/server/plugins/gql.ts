import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';
import path from 'node:path';

const getGQL = async () => {
  const typesArraySchema = await loadFiles(
    path.join(import.meta.dirname, '../../'),
    {
      extensions: ['.graphql-schema.ts', '.graphql-schema.js'], // js needed for the production build
    },
  );

  const typeDefsSchema = mergeTypeDefs(typesArraySchema, {
    throwOnConflict: true,
  });
  return print(typeDefsSchema);
};

export default getGQL;
