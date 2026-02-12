import { requestContext } from '@fastify/request-context';

/** Returns the current request ID, or 'no-request-context' if called outside a request lifecycle. */
function getRequestId(): string {
  return requestContext.get('requestId') ?? 'no-request-context';
}

export { getRequestId };
