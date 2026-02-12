import type { CommandCreator, Meta, Action } from '@/shared/cqrs/bus.types';

export function actionCreatorFactory(prefix?: string | null) {
  const base = prefix ? `${prefix}/` : '';

  function actionCreator<Payload>(type: string, commonMeta?: Meta) {
    const fullType = base + type;

    return Object.assign(
      (payload: Payload, meta?: Meta) => {
        const action: Action<Payload> = {
          type: fullType,
          payload,
        };

        if (commonMeta || meta) {
          action.meta = Object.assign({}, commonMeta, meta);
        }

        return action;
      },
      {
        type: fullType,
      },
    ) as CommandCreator<Payload>;
  }

  return actionCreator;
}
