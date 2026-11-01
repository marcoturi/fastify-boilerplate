/** The container key of a module file: `create-user.handler` → `createUserHandler` */
export function formatName(fileName: string): string {
  return fileName.replace(/[.-](\w)/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Builds an Awilix `formatName` that fails on a name clash: Awilix would otherwise let the
 * second module with the same name (e.g. two `create-user.handler.ts` in different modules)
 * silently replace the first. `taken` lists names already registered by hand.
 */
export function uniqueNameFormatter(taken: Iterable<string> = []) {
  const owners = new Map<string, string>();
  for (const name of taken) {
    owners.set(name, 'the global dependencies');
  }
  return (fileName: string, descriptor: { path: string }): string => {
    const name = formatName(fileName);
    const owner = owners.get(name);
    if (owner) {
      throw new Error(`DI name clash: "${name}" is registered by ${owner} and ${descriptor.path}`);
    }
    owners.set(name, descriptor.path);
    return name;
  };
}
