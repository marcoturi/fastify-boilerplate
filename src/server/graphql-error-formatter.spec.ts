import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import Fastify from 'fastify';
import mercurius from 'mercurius';
import {
  AlreadyExistsException,
  ArgumentInvalidException,
  DatabaseErrorException,
  NotFoundException,
} from '#src/shared/exceptions/index.ts';
import { graphqlErrorFormatter } from './graphql-error-formatter.ts';

class ThingAlreadyExistsError extends AlreadyExistsException {
  override readonly reason = 'THING_ALREADY_EXISTS';
}

interface GraphQLResponse {
  data: Record<string, unknown> | null;
  errors?: {
    message: string;
    path?: string[];
    extensions?: { code?: string; subErrors?: unknown };
  }[];
}

describe('graphqlErrorFormatter()', () => {
  const app = Fastify({ logger: false });

  before(async () => {
    // Stands in for under-pressure, which rejects requests while the server is overloaded
    app.addHook('onRequest', async (req) => {
      if (req.headers['x-overloaded']) {
        throw Object.assign(new Error('Service Unavailable'), {
          statusCode: 503,
          code: 'FST_UNDER_PRESSURE',
        });
      }
    });
    await app.register(mercurius, {
      schema: `type Query {
        invalid: String
        invalidFields: String
        missing: String
        duplicate: String
        thing: String
        database: String
        boom: String
        withProps: String
      }`,
      resolvers: {
        Query: {
          invalid: () => {
            throw new ArgumentInvalidException('limit must be >= 1');
          },
          invalidFields: () => {
            throw new ArgumentInvalidException('Validation error', [
              { path: '/limit', message: 'must be >= 1' },
            ]);
          },
          missing: () => {
            throw new NotFoundException('Thing not found');
          },
          duplicate: () => {
            throw new AlreadyExistsException('Record already exists');
          },
          thing: () => {
            throw new ThingAlreadyExistsError('Thing already exists');
          },
          database: () => {
            throw new DatabaseErrorException('relation "things" does not exist');
          },
          boom: () => {
            throw new Error('secret internal detail');
          },
          withProps: () => {
            throw new mercurius.ErrorWithProps('Custom', { code: 'CUSTOM' });
          },
        },
      },
      errorFormatter: graphqlErrorFormatter,
    });
    await app.ready();
  });

  after(() => app.close());

  const query = async (field: string) => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      body: { query: `{ ${field} }` },
    });
    return { statusCode: res.statusCode, body: res.json<GraphQLResponse>() };
  };

  for (const [field, code, message] of [
    ['invalid', 'BAD_USER_INPUT', 'limit must be >= 1'],
    ['missing', 'NOT_FOUND', 'Thing not found'],
    ['duplicate', 'ALREADY_EXISTS', 'Record already exists'],
    ['thing', 'THING_ALREADY_EXISTS', 'Thing already exists'],
  ] as const) {
    it(`maps ${field} to ${code} and keeps its message and path`, async () => {
      const { body } = await query(field);
      assert.equal(body.errors?.[0]?.extensions?.code, code);
      assert.equal(body.errors?.[0]?.message, message);
      assert.deepEqual(body.errors?.[0]?.path, [field]);
    });
  }

  it('lists the invalid fields of an invalid argument in extensions.subErrors', async () => {
    const { body } = await query('invalidFields');
    assert.equal(body.errors?.[0]?.extensions?.code, 'BAD_USER_INPUT');
    assert.deepEqual(body.errors?.[0]?.extensions?.subErrors, [
      { path: '/limit', message: 'must be >= 1' },
    ]);
  });

  for (const field of ['database', 'boom']) {
    it(`hides the message of ${field} behind INTERNAL_SERVER_ERROR`, async () => {
      const { statusCode, body } = await query(field);
      assert.equal(statusCode, 200);
      assert.equal(body.errors?.[0]?.extensions?.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(body.errors?.[0]?.message, 'Internal Server Error');
    });
  }

  it('keeps the status of a malformed request body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
      body: '{"query":',
    });
    assert.equal(res.statusCode, 400);
    assert.match(res.json<GraphQLResponse>().errors?.[0]?.message ?? '', /JSON/);
  });

  it('keeps the 503 of load shedding', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/graphql',
      headers: { 'x-overloaded': '1' },
      body: { query: '{ boom }' },
    });
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.json<GraphQLResponse>().errors?.[0], {
      message: 'Service Unavailable',
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  });

  it('leaves ErrorWithProps as they are', async () => {
    const { body } = await query('withProps');
    assert.equal(body.errors?.[0]?.extensions?.code, 'CUSTOM');
    assert.equal(body.errors?.[0]?.message, 'Custom');
  });

  it('leaves query validation errors as they are', async () => {
    const { statusCode, body } = await query('unknownField');
    assert.equal(statusCode, 400);
    assert.match(body.errors?.[0]?.message ?? '', /unknownField/);
  });
});
