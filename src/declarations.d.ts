import { Dependencies as InfrastructureDependencies } from '#src/modules/index.ts';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import {
  FastifyBaseLogger,
  FastifyInstance,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from 'fastify';

declare global {
  // Declare global DI container type
  // type Dependencies = InfrastructureDependencies;
  interface Dependencies extends InfrastructureDependencies {}
  // Ensures HTTP request is strongly typed from the schema
  type FastifyRouteInstance = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    TypeBoxTypeProvider
  >;
}

// Strongly Type DI container
declare module '@fastify/awilix' {
  interface Cradle extends Dependencies {}

  interface RequestCradle extends Dependencies {}
}

declare module '@fastify/request-context' {
  interface RequestContextData {
    requestId: string;
  }
}
