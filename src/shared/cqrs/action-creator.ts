import type { Action, CommandCreator, Meta } from '#src/shared/cqrs/bus.types.ts';

export function actionCreatorFactory(prefix?: string | null) {
  const base = prefix ? `${prefix}/` : '';

  function actionCreator<Payload, Result = unknown>(type: string, commonMeta?: Meta) {
    const fullType = base + type;

    return Object.assign(
      (payload: Payload, meta?: Meta) => {
        const action = {
          type: fullType,
          payload,
          ...(commonMeta || meta ? { meta: { ...commonMeta, ...meta } } : {}),
        } as Action<Payload, Result>;

        return action;
      },
      {
        type: fullType,
      },
    ) as CommandCreator<Payload, Result>;
  }

  return actionCreator;
}
