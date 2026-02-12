/**
 * Composes an array of middlewares into a single function.
 * Each middleware has the signature (action, handler) => Promise<unknown>.
 * Middlewares are applied left-to-right: the first middleware in the array
 * is the outermost wrapper.
 */
export function composeMiddlewares<TAction, THandler extends (action: TAction) => unknown>(
  middlewares: Array<(action: TAction, handler: THandler) => unknown>,
) {
  return (action: TAction, handler: THandler): unknown => {
    const chain = middlewares.reduceRight<THandler>(
      (next, middleware) => ((a: TAction) => middleware(a, next)) as THandler,
      handler,
    );
    return chain(action);
  };
}
