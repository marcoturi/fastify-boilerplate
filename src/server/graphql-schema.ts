import { glob } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

/** Loads every `*.graphql-schema.ts` file under `src/` and merges them into one SDL string. */
export async function loadGraphqlSchema() {
  const typeDefs = await Array.fromAsync(
    glob(path.join(import.meta.dirname, '../**/*.graphql-schema.ts')),
    async (file) => (await import(pathToFileURL(file).href)).default,
  );
  return print(mergeTypeDefs(typeDefs, { throwOnConflict: true }));
}
