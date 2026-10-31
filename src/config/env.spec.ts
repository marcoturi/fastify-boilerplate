import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseEnv } from './env.ts';

// The variables without a default
const required = {
  POSTGRES_URL: 'db.internal:6543',
  POSTGRES_PASSWORD: 'secret',
  POSTGRES_USER: 'app',
  POSTGRES_DB: 'app',
  NODE_ENV: 'production',
};

describe('parseEnv()', () => {
  it('splits POSTGRES_URL into host and port', () => {
    const { db } = parseEnv(required);
    assert.equal(db.host, 'db.internal');
    assert.equal(db.port, 6543);
  });

  it('uses port 5432 when POSTGRES_URL has none', () => {
    assert.equal(parseEnv({ ...required, POSTGRES_URL: 'db.internal' }).db.port, 5432);
  });

  it('applies the defaults', () => {
    const config = parseEnv(required);
    assert.deepEqual(config.server, { host: 'localhost', port: 3000 });
    assert.equal(config.log.level, 'info');
    assert.equal(config.db.ssl, false);
    assert.equal(config.db.poolMax, 10);
  });

  it('converts strings to the declared types', () => {
    const config = parseEnv({ ...required, POSTGRES_SSL: 'true', PORT: '8080' });
    assert.equal(config.db.ssl, true);
    assert.equal(config.server.port, 8080);
  });

  it('derives the environment flags from NODE_ENV', () => {
    assert.equal(parseEnv(required).isProduction, true);
    const development = parseEnv({ ...required, NODE_ENV: 'development' });
    assert.equal(development.isDevelopment, true);
    assert.equal(development.isProduction, false);
  });

  it('rejects a missing variable or an unknown value', () => {
    const { POSTGRES_URL: _, ...withoutUrl } = required;
    assert.throws(() => parseEnv(withoutUrl), /POSTGRES_URL/);
    assert.throws(() => parseEnv({ ...required, NODE_ENV: 'staging' }), /NODE_ENV/);
  });
});
