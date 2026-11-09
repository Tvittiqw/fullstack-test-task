import { describe, expect, it } from 'vitest';
import { canOnUser, visibleUsers } from '@/server/access/authorize';
import { user } from '../../helpers/users';

const ivan = user({ id: 'u-ivan', role: 'IT' });
const anna = user({ id: 'u-anna', role: 'manager' });
const oksana = user({ id: 'u-oksana', role: 'manager' });
const olena = user({ id: 'u-olena', role: 'user', managerId: 'u-anna' });
const dmytro = user({ id: 'u-dmytro', role: 'user', managerId: 'u-maksym' });
const nazar = user({ id: 'u-nazar', role: 'user' });
const everyone = [ivan, anna, oksana, olena, dmytro, nazar];

describe('canOnUser', () => {
  it('lets IT edit anyone', () => {
    expect(canOnUser(ivan, 'users.editProfile', anna)).toBe(true);
    expect(canOnUser(ivan, 'users.editProfile', nazar)).toBe(true);
  });

  it('lets a manager edit only their own direct reports', () => {
    expect(canOnUser(anna, 'users.editProfile', olena)).toBe(true);
    expect(canOnUser(anna, 'users.editProfile', anna)).toBe(false);
    expect(canOnUser(anna, 'users.editProfile', oksana)).toBe(false);
    expect(canOnUser(anna, 'users.editProfile', dmytro)).toBe(false);
    expect(canOnUser(anna, 'users.editProfile', nazar)).toBe(false);
  });

  it('does not let a manager edit a manager or IT account that reports to them', () => {
    const promoted = user({
      id: 'u-promoted',
      role: 'manager',
      managerId: anna.id,
    });
    const admin = user({ id: 'u-admin', role: 'IT', managerId: anna.id });
    expect(canOnUser(anna, 'users.editProfile', promoted)).toBe(false);
    expect(canOnUser(anna, 'users.editProfile', admin)).toBe(false);
    expect(visibleUsers(anna, [olena, promoted, admin])).toEqual([olena]);
  });

  it('denies a user even when the target points at them as manager', () => {
    const stray = user({ id: 'u-stray', role: 'user', managerId: nazar.id });
    expect(canOnUser(nazar, 'users.editProfile', stray)).toBe(false);
  });
});

describe('visibleUsers', () => {
  it('scopes the list per role', () => {
    expect(visibleUsers(ivan, everyone)).toEqual(everyone);
    expect(visibleUsers(anna, everyone)).toEqual([olena]);
    expect(visibleUsers(nazar, everyone)).toEqual([]);
  });
});
