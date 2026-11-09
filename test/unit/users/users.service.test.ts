import { beforeEach, describe, expect, it } from 'vitest';
import { getStore, resetStore } from '@/server/store/store';
import {
  changeRole,
  changeStatus,
  createUser,
  managerCandidates,
  updateProfile,
} from '@/server/users/users.service';
import { toPublic } from '@/server/users/users.repository';

const actor = (id: string) => {
  const user = getStore().users.get(id);
  if (!user) throw new Error(`missing seed user ${id}`);
  return toPublic(user);
};

const newUser = {
  fullName: 'New User',
  email: 'new@example.com',
  password: 'new1234',
  role: 'user' as const,
};

beforeEach(() => {
  resetStore();
});

describe('createUser', () => {
  it('creates an active user with managerId null when omitted', () => {
    const created = createUser(newUser);
    const { password, ...publicFields } = newUser;
    expect(created).toMatchObject({
      ...publicFields,
      status: 'active',
      managerId: null,
    });
    expect(created).not.toHaveProperty('password');
    expect(getStore().users.get(created.id)?.password).toBe(password);
  });

  it('409 email_taken for an existing email in a different case', () => {
    expect(() => createUser({ ...newUser, email: 'ANNA@example.com' })).toThrow(
      expect.objectContaining({ status: 409, code: 'email_taken' }),
    );
  });

  it('accepts an active manager and rejects anyone else as managerId', () => {
    expect(createUser({ ...newUser, managerId: 'u-oksana' }).managerId).toBe(
      'u-oksana',
    );
    for (const managerId of ['u-olena', 'u-maksym', 'nope']) {
      expect(() =>
        createUser({ ...newUser, email: `${managerId}@x.com`, managerId }),
      ).toThrow(
        expect.objectContaining({ status: 400, code: 'invalid_manager' }),
      );
    }
  });
});

describe('createUser manager rules', () => {
  it('rejects a manager for a role that is not a plain user', () => {
    expect(() =>
      createUser({ ...newUser, role: 'manager', managerId: 'u-anna' }),
    ).toThrow(
      expect.objectContaining({ status: 400, code: 'invalid_manager' }),
    );
    expect(() =>
      createUser({ ...newUser, role: 'IT', managerId: 'u-anna' }),
    ).toThrow(
      expect.objectContaining({ status: 400, code: 'invalid_manager' }),
    );
  });
});

describe('createUser order of checks', () => {
  it('reports an invalid manager (400) before a taken email (409)', () => {
    expect(() =>
      createUser({ ...newUser, email: 'anna@example.com', managerId: 'nope' }),
    ).toThrow(
      expect.objectContaining({ status: 400, code: 'invalid_manager' }),
    );
  });
});

describe('managerCandidates', () => {
  it('returns the active users whose role manages reports', () => {
    expect(
      managerCandidates()
        .map((u) => u.id)
        .sort(),
    ).toEqual(['u-anna', 'u-oksana']);
  });
});

describe('updateProfile', () => {
  it('404 for an unknown id before any scope check', () => {
    expect(() =>
      updateProfile(actor('u-anna'), 'missing', { fullName: 'X' }),
    ).toThrow(expect.objectContaining({ status: 404 }));
  });

  it('403 out_of_scope for a manager editing a non-report', () => {
    expect(() =>
      updateProfile(actor('u-anna'), 'u-dmytro', { fullName: 'X' }),
    ).toThrow(expect.objectContaining({ status: 403, code: 'out_of_scope' }));
  });

  it('updates an own report', () => {
    expect(
      updateProfile(actor('u-anna'), 'u-olena', { fullName: 'Olena B.' })
        .fullName,
    ).toBe('Olena B.');
  });

  it("409 email_taken for another user's email, but allows keeping the same email", () => {
    expect(() =>
      updateProfile(actor('u-ivan'), 'u-olena', { email: 'anna@example.com' }),
    ).toThrow(expect.objectContaining({ status: 409, code: 'email_taken' }));
    expect(
      updateProfile(actor('u-ivan'), 'u-olena', { email: 'olena@example.com' })
        .email,
    ).toBe('olena@example.com');
  });
});

describe('changeStatus and changeRole', () => {
  it('applies the change for another user', () => {
    expect(changeStatus(actor('u-ivan'), 'u-olena', 'deactivated').status).toBe(
      'deactivated',
    );
    expect(changeRole(actor('u-ivan'), 'u-olena', 'manager').role).toBe(
      'manager',
    );
  });

  it('propagates self_change as 403 and last_active_in_role as 409', () => {
    const ivan = actor('u-ivan');
    expect(() => changeStatus(ivan, 'u-ivan', 'deactivated')).toThrow(
      expect.objectContaining({ status: 403, code: 'self_change' }),
    );
    changeStatus(ivan, 'u-petro', 'deactivated');
    expect(() => changeStatus(ivan, 'u-ivan', 'deactivated')).toThrow(
      expect.objectContaining({ status: 409, code: 'last_active_in_role' }),
    );
  });
});
