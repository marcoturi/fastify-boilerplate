import { requestContext } from '@fastify/request-context';

// Get request ID
function getRequestId(): string {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return requestContext.get('requestId')!;
}

export { getRequestId };
