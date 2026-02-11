import { requestContext } from '@fastify/request-context';

// Get request ID
function getRequestId(): string {
  // biome-ignore lint/style/noNonNullAssertion: needed
  return requestContext.get('requestId')!;
}

export { getRequestId };
