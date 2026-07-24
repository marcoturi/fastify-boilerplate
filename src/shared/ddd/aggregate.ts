import type { Action, EventPublisher } from '#src/shared/cqrs/bus.types.ts';

/**
 * Functional equivalent of a DDD AggregateRoot's recorded events: a domain operation
 * returns the resulting entity together with the domain events it produced, plus a
 * `commit()` that publishes them. The command handler calls `commit(eventBus)` after
 * persistence — mirroring NestJS's `aggregate.apply()` (record) + `aggregate.commit()`
 * (publish after save), without classes.
 *
 * `commit` depends on the minimal {@link EventPublisher} port (not the full bus) and is
 * async, so switching to a transactional outbox later is a change here only — callers
 * already `await created.commit(...)`.
 */
export interface DomainResult<T> {
  entity: T;
  readonly events: Action<unknown>[];
  /** Publishes the recorded domain events. Call it after the write succeeds. */
  commit(publisher: EventPublisher): Promise<void>;
}

export const withEvents = <T>(entity: T, events: Action<unknown>[] = []): DomainResult<T> => ({
  entity,
  events,
  async commit(publisher: EventPublisher) {
    for (const event of events) {
      await publisher.emit(event);
    }
  },
});
