import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { uniqueNameFormatter } from '#src/server/di/util.ts';

describe('Awilix: uniqueNameFormatter()', () => {
  it('converts hyphenated and dotted file names to camelCase', () => {
    const format = uniqueNameFormatter();
    assert.equal(
      format('user-test.repository', { path: 'user/user-test.repository.ts' }),
      'userTestRepository',
    );
    assert.equal(format('user.repository', { path: 'user/user.repository.ts' }), 'userRepository');
    assert.equal(format('user.mapper', { path: 'user/user.mapper.ts' }), 'userMapper');
  });

  it('throws when two modules map to the same name, naming both files', () => {
    const format = uniqueNameFormatter();
    format('create-user.handler', { path: 'user/create-user.handler.ts' });
    assert.throws(
      () => format('create-user.handler', { path: 'admin/create-user.handler.ts' }),
      /"createUserHandler" is registered by user\/create-user\.handler\.ts and admin\/create-user\.handler\.ts/,
    );
  });

  it('throws when a module takes the name of a global dependency', () => {
    const format = uniqueNameFormatter(['db', 'logger']);
    assert.throws(
      () => format('db', { path: 'shared/db.ts' }),
      /"db" is registered by the global dependencies/,
    );
  });
});
