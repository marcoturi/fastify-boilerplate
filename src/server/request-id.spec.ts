import assert from 'node:assert/strict';
import type { IncomingMessage } from 'node:http';
import { describe, it } from 'node:test';
import { requestId } from './request-id.ts';

const request = (header?: string | string[]) =>
  ({ headers: header === undefined ? {} : { 'request-id': header } }) as unknown as IncomingMessage;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('requestId()', () => {
  it("keeps the client's id when it is short and plain", () => {
    assert.equal(requestId(request('abc-123_x.y')), 'abc-123_x.y');
  });

  it('generates a UUID when the header is missing', () => {
    assert.match(requestId(request()), UUID);
  });

  it('generates a UUID for an unsafe or oversized id', () => {
    assert.match(requestId(request('a b\n{"injected":true}')), UUID);
    assert.match(requestId(request('x'.repeat(129))), UUID);
    assert.match(requestId(request(['a', 'b'])), UUID);
  });
});
