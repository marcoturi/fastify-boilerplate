import { formatName } from '@/server/di/util';
import { expect, test } from 'vitest';

test('Awilix: formatName()', () => {
  expect(formatName('user-test.repository')).toBe('userTestRepository');
  expect(formatName('user.repository')).toBe('userRepository');
  expect(formatName('user.mapper')).toBe('userMapper');
});
