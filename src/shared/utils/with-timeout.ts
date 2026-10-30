/** Settles like `promise`, but rejects with `message` if it takes longer than `ms`. */
export async function withTimeout<T>(promise: PromiseLike<T>, ms: number, message: string) {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}
