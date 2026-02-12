/**
 * Left-to-right function composition.
 * The first function may accept multiple arguments; subsequent functions
 * each receive the return value of the previous one.
 */
export function pipe(...fns: Array<(...args: any[]) => any>) {
  return (...args: any[]) =>
    fns.reduce((result, fn, i) => (i === 0 ? fn(...args) : fn(result)), undefined as any);
}
