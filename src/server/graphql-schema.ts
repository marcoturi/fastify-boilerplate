import path from 'node:path';
import { loadFiles } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

/** Loads every `*.graphql-schema.ts` file under `src/` and merges them into one SDL string. */
export async function loadGraphqlSchema() {
  const typeDefs = await loadFiles(path.join(import.meta.dirname, '..'), {
    extensions: ['.graphql-schema.ts'],
  });
  return print(mergeTypeDefs(typeDefs, { throwOnConflict: true }));
}
