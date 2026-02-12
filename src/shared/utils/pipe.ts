/**
 * Left-to-right function composition.
 * The first function may accept multiple arguments; subsequent functions
 * each receive the return value of the previous one.
 */
// biome-ignore lint/suspicious/noExplicitAny: variadic pipe requires flexible function signatures
export function pipe(...fns: Array<(...args: any[]) => unknown>) {
  // biome-ignore lint/suspicious/noExplicitAny: first function receives original args of unknown shape
  return (...args: any[]) =>
    fns.reduce((result, fn, i) => (i === 0 ? fn(...args) : fn(result)), undefined as unknown);
}
