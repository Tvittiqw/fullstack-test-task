import { describe, expect, it } from 'vitest';
import { authorizeUserChange, DENIALS } from '@/server/access/user-change';
import { user } from '../../helpers/users';

const ivan = user({ id: 'u-ivan', role: 'IT' });
const petro = user({ id: 'u-petro', role: 'IT' });
const anna = user({ id: 'u-anna', role: 'manager' });
const olena = user({ id: 'u-olena', role: 'user', managerId: 'u-anna' });
const everyone = [ivan, petro, anna, olena];

describe('authorizeUserChange', () => {
  it('refuses to remove the last active IT, before the self-change rule', () => {
    const users = [ivan, anna, olena];
    expect(
      authorizeUserChange(ivan, ivan, { status: 'deactivated' }, users),
    ).toEqual({ ok: false, denial: DENIALS.lastActiveIt });
    expect(authorizeUserChange(ivan, ivan, { role: 'manager' }, users)).toEqual(
      { ok: false, denial: DENIALS.lastActiveIt },
    );
  });

  it('forbids self deactivation or demotion when another IT is active', () => {
    expect(
      authorizeUserChange(ivan, ivan, { status: 'deactivated' }, everyone),
    ).toEqual({ ok: false, denial: DENIALS.selfChange });
    expect(authorizeUserChange(ivan, ivan, { role: 'user' }, everyone)).toEqual(
      { ok: false, denial: DENIALS.selfChange },
    );
  });

  it('allows deactivating the other IT while two are active', () => {
    expect(
      authorizeUserChange(ivan, petro, { status: 'deactivated' }, everyone),
    ).toEqual({ ok: true });
  });

  it('allows changing other users', () => {
    expect(
      authorizeUserChange(ivan, anna, { status: 'deactivated' }, everyone),
    ).toEqual({ ok: true });
    expect(authorizeUserChange(ivan, anna, { role: 'user' }, everyone)).toEqual(
      { ok: true },
    );
  });
});
