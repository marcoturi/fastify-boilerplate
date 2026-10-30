import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

// A client-supplied id ends up in every log line and error body: accept only short, plain ids
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

/** The client's `request-id` header when it is a safe id, otherwise a new UUID. */
export function requestId(req: IncomingMessage): string {
  // header best practice: don't use "x-" https://www.rfc-editor.org/info/rfc6648 and keep it lowercase
  const header = req.headers['request-id'];
  return typeof header === 'string' && SAFE_REQUEST_ID.test(header) ? header : randomUUID();
}
