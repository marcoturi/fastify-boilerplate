import type { Action, ActionCreator, Meta } from '#src/shared/cqrs/bus.types.ts';

/** Builds the action creators of a module: their types are `<prefix>/<type>` */
export function actionCreatorFactory(prefix?: string) {
  const base = prefix ? `${prefix}/` : '';

  return <Payload, Result = unknown>(type: string): ActionCreator<Payload, Result> => {
    const fullType = base + type;
    return Object.assign(
      (payload: Payload, meta?: Meta) =>
        ({ type: fullType, payload, ...(meta && { meta }) }) as Action<Payload, Result>,
      { type: fullType },
    );
  };
}
