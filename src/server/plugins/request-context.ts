import { type FastifyRequestContextOptions, fastifyRequestContext } from '@fastify/request-context';

// Autoload registers the plugin with these options: every request starts with its id in the
// context, read by getRequestId()
export const autoConfig: FastifyRequestContextOptions = {
  defaultStoreValues: (req) => ({ requestId: req.id }),
};

export default fastifyRequestContext;
