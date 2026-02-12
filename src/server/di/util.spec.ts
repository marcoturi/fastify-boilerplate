import { formatName } from '#src/server/di/util.ts';
import assert from 'node:assert/strict';
import { describe } from 'node:test';

describe('Awilix: formatName()', () => {
  assert.equal(formatName('user-test.repository'), 'userTestRepository');
  assert.equal(formatName('user.repository'), 'userRepository');
  assert.equal(formatName('user.mapper'), 'userMapper');
});
