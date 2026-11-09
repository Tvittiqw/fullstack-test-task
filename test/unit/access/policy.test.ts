import { describe, expect, it } from 'vitest';
import { PERMISSIONS, type Permission } from '@/shared/permissions';
import type { Role } from '@/shared/roles';
import { canManageReports, policyFor } from '@/server/access/policy';

const MATRIX: Record<Role, Permission[]> = {
  IT: [
    'users.list',
    'users.create',
    'users.editProfile',
    'users.changeRole',
    'users.changeStatus',
  ],
  manager: ['users.list', 'users.editProfile', 'content.view'],
  user: ['content.view'],
};

describe('policyFor', () => {
  it.each(Object.entries(MATRIX) as [Role, Permission[]][])(
    '%s has exactly the permissions from the task table',
    (role, allowed) => {
      for (const permission of PERMISSIONS) {
        expect(policyFor(role).permissions.has(permission)).toBe(
          allowed.includes(permission),
        );
      }
    },
  );

  it('lands IT on /manage-users and everyone else on /content', () => {
    expect(policyFor('IT').landingRoute).toBe('/manage-users');
    expect(policyFor('manager').landingRoute).toBe('/content');
    expect(policyFor('user').landingRoute).toBe('/content');
  });
});

describe('keepOneActive', () => {
  it('protects only the role that administers users', () => {
    expect(policyFor('IT').keepOneActive).toBe(true);
    expect(policyFor('manager').keepOneActive).toBe(false);
    expect(policyFor('user').keepOneActive).toBe(false);
  });
});

describe('canManageReports', () => {
  it('is true only for the role scoped to direct reports', () => {
    expect(canManageReports('manager')).toBe(true);
    expect(canManageReports('IT')).toBe(false);
    expect(canManageReports('user')).toBe(false);
  });
});
