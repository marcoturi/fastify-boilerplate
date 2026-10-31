import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Type } from 'typebox';
import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { validator } from './validator.util.ts';

describe('validator()', () => {
  const validate = validator(Type.Object({ email: Type.String({ format: 'email' }) }));

  it('returns the input when it matches the schema', () => {
    const input = { email: 'mario.rossi@pec.it' };
    assert.equal(validate(input), input);
  });

  it('throws ArgumentInvalidException with one sub-error per invalid field', () => {
    assert.throws(
      () => validate({ email: 'not-an-email' }),
      (error: unknown) =>
        error instanceof ArgumentInvalidException &&
        error.subErrors?.length === 1 &&
        error.subErrors[0]?.path === '/email',
    );
  });
});
