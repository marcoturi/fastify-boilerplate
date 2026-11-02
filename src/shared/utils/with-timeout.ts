/** Settles like `promise`, but rejects with `message` if it takes longer than `ms`. */
export async function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string) {
  const timeout = Promise.withResolvers<never>();
  // A Node timer is disposable: `using` clears it however the race ends
  using _timer = setTimeout(() => timeout.reject(new Error(message)), ms);
  return await Promise.race([promise, timeout.promise]);
}
