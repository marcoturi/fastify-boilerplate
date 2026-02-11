import { type Static, Type } from 'typebox';

export const apiErrorResponseSchema = Type.Object(
  {
    statusCode: Type.Number({ example: 400 }),
    message: Type.String({ example: 'Validation Error' }),
    error: Type.String({ example: 'Bad Request' }),
    correlationId: Type.String({ example: 'YevPQs' }),
    subErrors: Type.Optional(
      Type.String({
        description: 'Optional list of sub-errors',
        example: 'incorrect email',
      }),
    ),
  },
  { $id: 'ApiErrorResponse' },
);

export type ApiErrorResponse = Static<typeof apiErrorResponseSchema>;
