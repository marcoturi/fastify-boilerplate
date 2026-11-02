import { glob } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** The SDL of every `*.graphql-schema.ts` file under `src/`, which Mercurius joins into one
 *  schema. Modules add their fields to the root types with `extend type Query` (or `Mutation`). */
export async function loadGraphqlSchema() {
  const typeDefs = await Array.fromAsync(
    glob(path.join(import.meta.dirname, '../**/*.graphql-schema.ts')),
    async (file) => (await import(pathToFileURL(file).href)).default,
  );
  return ['type Query\ntype Mutation', ...typeDefs];
}
