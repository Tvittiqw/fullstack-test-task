import type { PublicUser } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';
import { policyFor } from './policy';

export function can(actor: PublicUser, permission: Permission): boolean {
  return policyFor(actor.role).permissions.has(permission);
}

export function withinScope(actor: PublicUser, target: PublicUser): boolean {
  const scope = policyFor(actor.role).userScope;
  if (scope === 'all') return true;
  if (scope === 'reports') {
    return (
      target.managerId === actor.id && policyFor(target.role).userScope === null
    );
  }
  return false;
}

export function canOnUser(
  actor: PublicUser,
  permission: Permission,
  target: PublicUser,
): boolean {
  return can(actor, permission) && withinScope(actor, target);
}

export function visibleUsers(
  actor: PublicUser,
  all: PublicUser[],
): PublicUser[] {
  return all.filter((target) => withinScope(actor, target));
}
