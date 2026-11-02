import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import userDomain from '#src/modules/user/domain/user.domain.ts';
import { UserAlreadyExistsError } from '#src/modules/user/domain/user.errors.ts';
import { createUserEvent } from '#src/modules/user/domain/user.events.ts';
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import type { Action } from '#src/shared/cqrs/bus.types.ts';
import { requestBus } from '#src/shared/cqrs/request-bus.ts';
import { AlreadyExistsException } from '#src/shared/exceptions/index.ts';
import createUserHandler, { createUserCommand } from './create-user.handler.ts';

const payload = {
  email: 'test@test.it',
  country: 'Italy',
  postalCode: '12345',
  street: 'Via Roma',
};

/** Runs the command through a bus with a fake repository and event bus, recording the calls */
function setup(failInsert?: () => Promise<never>) {
  const steps: string[] = [];
  const inserted: UserEntity[] = [];
  const emitted: Action<unknown>[] = [];
  const userRepository = {
    insert: async (user: UserEntity) => {
      steps.push('insert');
      await failInsert?.();
      inserted.push(user);
    },
  };
  const eventBus = {
    emit: (event: Action<unknown>) => {
      steps.push('emit');
      emitted.push(event);
    },
  };
  const commandBus = requestBus('Command');
  createUserHandler({
    userRepository,
    userDomain: userDomain(),
    commandBus,
    eventBus,
  } as unknown as Dependencies).init();
  const execute = () => commandBus.execute(createUserCommand(payload));
  return { execute, steps, inserted, emitted };
}

describe('createUserHandler()', () => {
  it('emits user/created with the new user once the insert succeeds, and returns its id', async () => {
    const { execute, steps, inserted, emitted } = setup();
    const id = await execute();
    const [user] = inserted;
    assert.ok(user);
    assert.equal(id, user.id);
    assert.deepEqual(steps, ['insert', 'emit']);
    assert.equal(emitted[0]?.type, createUserEvent.type);
    assert.equal(emitted[0]?.payload, user);
  });

  it('turns a duplicate into UserAlreadyExistsError and emits nothing', async () => {
    const { execute, emitted } = setup(async () => {
      throw new AlreadyExistsException('duplicate key');
    });
    await assert.rejects(execute(), UserAlreadyExistsError);
    assert.equal(emitted.length, 0);
  });

  it('rethrows any other failure and emits nothing', async () => {
    const failure = new Error('connection lost');
    const { execute, emitted } = setup(async () => {
      throw failure;
    });
    await assert.rejects(execute(), (error) => error === failure);
    assert.equal(emitted.length, 0);
  });
});
