import type { Permission } from '@/shared/permissions';
import type { Role } from '@/shared/roles';

export type UserScope = 'all' | 'reports';

export type RolePolicy = {
  permissions: ReadonlySet<Permission>;
  userScope: UserScope | null;
  keepOneActive: boolean;
  landingRoute: string;
};

const permissionSet = (...perms: Permission[]): ReadonlySet<Permission> =>
  new Set(perms);

export const ROLE_POLICY: Record<Role, RolePolicy> = {
  IT: {
    permissions: permissionSet(
      'users.list',
      'users.create',
      'users.editProfile',
      'users.changeRole',
      'users.changeStatus',
    ),
    userScope: 'all',
    keepOneActive: true,
    landingRoute: '/manage-users',
  },
  manager: {
    permissions: permissionSet(
      'users.list',
      'users.editProfile',
      'content.view',
    ),
    userScope: 'reports',
    keepOneActive: false,
    landingRoute: '/content',
  },
  user: {
    permissions: permissionSet('content.view'),
    userScope: null,
    keepOneActive: false,
    landingRoute: '/content',
  },
};

export const policyFor = (role: Role): RolePolicy => ROLE_POLICY[role];

export const permissionsOf = (role: Role): Permission[] => [
  ...policyFor(role).permissions,
];

export const canManageReports = (role: Role): boolean =>
  policyFor(role).userScope === 'reports';
