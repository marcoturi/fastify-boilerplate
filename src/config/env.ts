import envSchema from 'env-schema';
import { type Static, Type } from 'typebox';
// biome-ignore lint/style/noRestrictedImports: package.json sits outside the aliased folders
import packageJson from '../../package.json' with { type: 'json' };

const NodeEnv = {
  development: 'development',
  production: 'production',
  test: 'test',
} as const;

export const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;
export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

const schema = Type.Object({
  // `host` or `host:port`, not a connection URL: anything else fails at startup, rather than
  // as an unclear connection error on the first query
  POSTGRES_URL: Type.String({ pattern: '^[^:/\\s]+(:\\d{1,5})?$' }),
  POSTGRES_PASSWORD: Type.String(),
  POSTGRES_USER: Type.String(),
  POSTGRES_DB: Type.String(),
  // Enable TLS for the DB connection. Keep `false` for local/CI Postgres; set `true`
  // in production (most managed Postgres providers require TLS). The server certificate
  // must be trusted by Node: for a private CA, point NODE_EXTRA_CA_CERTS to it.
  POSTGRES_SSL: Type.Boolean({ default: false }),
  // Connection pool tuning (see https://github.com/porsager/postgres#connection).
  POSTGRES_POOL_MAX: Type.Integer({ minimum: 1, default: 10 }),
  POSTGRES_IDLE_TIMEOUT: Type.Number({ minimum: 0, default: 20 }),
  POSTGRES_CONNECT_TIMEOUT: Type.Number({ minimum: 0, default: 30 }),
  LOG_LEVEL: Type.Enum(LogLevel, { default: LogLevel.info }),
  NODE_ENV: Type.Enum(NodeEnv),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Integer({ minimum: 1, maximum: 65_535, default: 3000 }),
});

/**
 * Validates the environment variables and derives the app configuration from them. It reads
 * process.env and the .env file; `data`, when given, replaces both (unit tests use it).
 */
export function parseEnv(data?: Record<string, string>) {
  const env = envSchema<Static<typeof schema>>(
    data ? { schema, data, env: false } : { schema, dotenv: true },
  );

  // POSTGRES_URL holds `host:port` (the port is optional), not a connection URL: the schema
  // pattern guarantees the host, the port range is checked here
  const [dbHost, dbPort = '5432'] = env.POSTGRES_URL.split(':') as [string, string?];
  if (Number(dbPort) < 1 || Number(dbPort) > 65_535) {
    throw new Error(`POSTGRES_URL: port ${dbPort} is out of range 1-65535`);
  }

  return {
    nodeEnv: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === NodeEnv.development,
    isProduction: env.NODE_ENV === NodeEnv.production,
    // Read from package.json: npm_package_version is set only when started through pnpm
    version: packageJson.version,
    log: {
      level: env.LOG_LEVEL,
    },
    server: {
      host: env.HOST,
      port: env.PORT,
    },
    db: {
      // Separate fields rather than a connection URL, so credentials need no escaping
      host: dbHost,
      port: Number(dbPort),
      user: env.POSTGRES_USER,
      password: env.POSTGRES_PASSWORD,
      database: env.POSTGRES_DB,
      ssl: env.POSTGRES_SSL,
      poolMax: env.POSTGRES_POOL_MAX,
      idleTimeout: env.POSTGRES_IDLE_TIMEOUT,
      connectTimeout: env.POSTGRES_CONNECT_TIMEOUT,
    },
  };
}
