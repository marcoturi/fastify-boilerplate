import { AsyncLocalStorage } from 'node:async_hooks';

interface OpenTransaction<Tx> {
  tx: Tx;
  open: boolean;
}

/**
 * Tracks the transaction of the current async context, so code called inside a transaction
 * (repositories included) can run its queries on it. A transaction is visible only while it is
 * open: async work it started that runs after the commit (e.g. event handlers) gets none.
 */
export function transactionContext<Tx>() {
  const store = new AsyncLocalStorage<OpenTransaction<Tx>>();
  return {
    /** The open transaction of the current async context, if any */
    current(): Tx | undefined {
      const entry = store.getStore();
      return entry?.open ? entry.tx : undefined;
    },
    /** Runs `fn` with `tx` as the current transaction, until `fn` settles */
    async run<T>(tx: Tx, fn: () => Promise<T>): Promise<T> {
      const entry = { tx, open: true };
      try {
        return await store.run(entry, fn);
      } finally {
        entry.open = false;
      }
    },
  };
}
