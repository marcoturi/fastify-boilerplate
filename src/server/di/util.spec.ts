import { formatName } from '#src/server/di/util.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Awilix: formatName()', () => {
  it('should convert hyphenated and dotted file names to camelCase', () => {
    assert.equal(formatName('user-test.repository'), 'userTestRepository');
  });

  it('should convert dotted file names to camelCase', () => {
    assert.equal(formatName('user.repository'), 'userRepository');
  });

  it('should handle mapper file names', () => {
    assert.equal(formatName('user.mapper'), 'userMapper');
  });
});
