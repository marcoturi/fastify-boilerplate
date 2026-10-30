import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { transactionContext } from './transaction-context.ts';

describe('transactionContext()', () => {
  it('has no current transaction outside run()', () => {
    assert.equal(transactionContext<string>().current(), undefined);
  });

  it('exposes the transaction to code running inside run(), across awaits', async () => {
    const transactions = transactionContext<string>();
    const seen = await transactions.run('tx1', async () => {
      await new Promise((resolve) => setImmediate(resolve));
      return transactions.current();
    });
    assert.equal(seen, 'tx1');
  });

  it('hides the transaction from work that outlives run()', async () => {
    const transactions = transactionContext<string>();
    let later: Promise<string | undefined> | undefined;
    await transactions.run('tx1', async () => {
      later = new Promise((resolve) => setTimeout(() => resolve(transactions.current()), 20));
    });
    assert.equal(await later, undefined);
  });

  it('closes the transaction when run() rejects', async () => {
    const transactions = transactionContext<string>();
    let later: Promise<string | undefined> | undefined;
    await assert.rejects(
      transactions.run('tx1', async () => {
        later = new Promise((resolve) => setTimeout(() => resolve(transactions.current()), 20));
        throw new Error('rollback');
      }),
      /rollback/,
    );
    assert.equal(await later, undefined);
  });
});
