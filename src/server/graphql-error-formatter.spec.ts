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
  errors?: { message: string; path?: string[]; extensions?: { code?: string } }[];
}

describe('graphqlErrorFormatter()', () => {
  const app = Fastify({ logger: false });

  before(async () => {
    await app.register(mercurius, {
      schema: `type Query {
        invalid: String
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

  for (const field of ['database', 'boom']) {
    it(`hides the message of ${field} behind INTERNAL_SERVER_ERROR`, async () => {
      const { body } = await query(field);
      assert.equal(body.errors?.[0]?.extensions?.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(body.errors?.[0]?.message, 'Internal Server Error');
    });
  }

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
