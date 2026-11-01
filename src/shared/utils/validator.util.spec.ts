import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Type } from 'typebox';
import { ArgumentInvalidException } from '#src/shared/exceptions/index.ts';
import { validator } from './validator.util.ts';

describe('validator()', () => {
  const validate = validator(
    Type.Object({
      email: Type.String({ format: 'email' }),
      street: Type.Optional(Type.String()),
    }),
  );

  it('returns the input when it matches the schema', () => {
    assert.deepEqual(validate({ email: 'mario.rossi@pec.it' }), { email: 'mario.rossi@pec.it' });
  });

  it('treats null fields as absent, as GraphQL sends them for optional arguments', () => {
    assert.deepEqual(validate({ email: 'mario.rossi@pec.it', street: null }), {
      email: 'mario.rossi@pec.it',
    });
  });

  it('throws ArgumentInvalidException with the invalid field', () => {
    assert.throws(
      () => validate({ email: 'not-an-email' }),
      (error: unknown) =>
        error instanceof ArgumentInvalidException &&
        error.subErrors?.length === 1 &&
        error.subErrors[0]?.path === '/email',
    );
  });

  it('points a missing field to the field, not to its parent object', () => {
    assert.throws(
      () => validate({ street: 'Via Roma' }),
      (error: unknown) =>
        error instanceof ArgumentInvalidException && error.subErrors?.[0]?.path === '/email',
    );
  });
});
