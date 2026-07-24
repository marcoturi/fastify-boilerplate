import envSchema from 'env-schema';
import { type Static, Type } from 'typebox';

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
  POSTGRES_URL: Type.String(),
  POSTGRES_PASSWORD: Type.String(),
  POSTGRES_USER: Type.String(),
  POSTGRES_DB: Type.String(),
  // Enable TLS for the DB connection. Keep `false` for local/CI Postgres; set `true`
  // in production (most managed Postgres providers require TLS).
  POSTGRES_SSL: Type.Boolean({ default: false }),
  // Connection pool tuning (see https://github.com/porsager/postgres#connection).
  POSTGRES_POOL_MAX: Type.Number({ default: 10 }),
  POSTGRES_IDLE_TIMEOUT: Type.Number({ default: 20 }),
  POSTGRES_CONNECT_TIMEOUT: Type.Number({ default: 30 }),
  LOG_LEVEL: Type.Enum(LogLevel),
  NODE_ENV: Type.Enum(NodeEnv),
  HOST: Type.String({ default: 'localhost' }),
  PORT: Type.Number({ default: 3000 }),
});

const env = envSchema<Static<typeof schema>>({
  dotenv: true,
  schema,
});

export default {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === NodeEnv.development,
  isProduction: env.NODE_ENV === NodeEnv.production,
  version: process.env.npm_package_version ?? '0.0.0',
  log: {
    level: env.LOG_LEVEL,
  },
  server: {
    host: env.HOST,
    port: env.PORT,
  },
  db: {
    url: `postgres://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_URL}/${env.POSTGRES_DB}`,
    ssl: env.POSTGRES_SSL,
    poolMax: env.POSTGRES_POOL_MAX,
    idleTimeout: env.POSTGRES_IDLE_TIMEOUT,
    connectTimeout: env.POSTGRES_CONNECT_TIMEOUT,
  },
};
