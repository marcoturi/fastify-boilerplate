import type { Action, ActionCreator, Meta } from '#src/shared/cqrs/bus.types.ts';

/** Builds the action creators of a module: their types are `<prefix>/<type>`. Without a
 *  `Result`, a creator makes events: the event bus takes only those */
export function actionCreatorFactory(prefix?: string) {
  const base = prefix ? `${prefix}/` : '';

  return <Payload, Result = void>(type: string): ActionCreator<Payload, Result> => {
    const fullType = base + type;
    return Object.assign(
      (payload: Payload, meta?: Meta) =>
        ({ type: fullType, payload, ...(meta && { meta }) }) as Action<Payload, Result>,
      { type: fullType },
    );
  };
}
