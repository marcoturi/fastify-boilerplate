import { requestContext } from '@fastify/request-context';

// Get request ID
function getRequestId(): string {
  return requestContext.get('requestId')!;
}

export { getRequestId };
