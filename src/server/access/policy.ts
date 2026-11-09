import type { Permission } from '@/shared/permissions';
import type { Role } from '@/shared/roles';

export type UserScope = 'all' | 'reports';

export type RolePolicy = {
  permissions: ReadonlySet<Permission>;
  userScope: UserScope | null;
  landingRoute: string;
};

const set = (...perms: Permission[]): ReadonlySet<Permission> => new Set(perms);

export const ROLE_POLICY: Record<Role, RolePolicy> = {
  IT: {
    permissions: set(
      'users.list',
      'users.create',
      'users.editProfile',
      'users.changeRole',
      'users.changeStatus',
    ),
    userScope: 'all',
    landingRoute: '/manage-users',
  },
  manager: {
    permissions: set('users.list', 'users.editProfile', 'content.view'),
    userScope: 'reports',
    landingRoute: '/content',
  },
  user: {
    permissions: set('content.view'),
    userScope: null,
    landingRoute: '/content',
  },
};

export const policyFor = (role: Role): RolePolicy => ROLE_POLICY[role];

export const permissionsOf = (role: Role): Permission[] => [
  ...policyFor(role).permissions,
];

export const canManageReports = (role: Role): boolean =>
  policyFor(role).userScope === 'reports';
