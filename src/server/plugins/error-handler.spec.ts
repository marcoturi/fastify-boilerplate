import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import Fastify from 'fastify';
import { NotFoundException } from '#src/shared/exceptions/index.ts';
import errorHandler from './error-handler.ts';

describe('errorHandler plugin', () => {
  const app = Fastify({ logger: false });

  before(async () => {
    await app.register(errorHandler);
    app.post('/echo', async (req) => req.body);
    app.get('/missing', async () => {
      throw new NotFoundException('User not found');
    });
    app.get('/boom', async () => {
      throw new Error('secret internal detail');
    });
    await app.ready();
  });

  after(() => app.close());

  it('keeps the 400 of a malformed JSON body instead of a 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'application/json' },
      body: '{"broken":',
    });
    assert.equal(res.statusCode, 400);
    assert.equal(res.json().error, 'Bad Request');
    assert.ok(res.json().correlationId);
  });

  it('keeps the 415 of an unsupported content type', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/echo',
      headers: { 'content-type': 'text/xml' },
      body: '<a/>',
    });
    assert.equal(res.statusCode, 415);
    assert.equal(res.json().error, 'Unsupported Media Type');
  });

  it('answers unknown routes with the error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/nope' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().error, 'Not Found');
    assert.ok(res.json().correlationId);
  });

  it('maps domain exceptions to their status code', async () => {
    const res = await app.inject({ method: 'GET', url: '/missing' });
    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, 'User not found');
  });

  it('hides the message of unexpected errors behind a 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/boom' });
    assert.equal(res.statusCode, 500);
    assert.equal(res.json().message, 'Internal Server Error');
  });
});
