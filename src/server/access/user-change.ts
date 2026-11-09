import type { PublicUser, UserStatus } from '@/shared/api-types';
import type { Role } from '@/shared/roles';
import { withinScope } from './authorize';
import { policyFor } from './policy';

export type Denial = {
  kind: 'forbidden' | 'conflict';
  code: string;
  message: string;
};

export type Decision = { ok: true } | { ok: false; denial: Denial };

export type UserChange = { role: Role } | { status: UserStatus };

export const DENIALS = {
  outOfScope: {
    kind: 'forbidden',
    code: 'out_of_scope',
    message: 'You can only manage your direct reports',
  },
  lastActiveInRole: {
    kind: 'conflict',
    code: 'last_active_in_role',
    message: 'Cannot deactivate or demote the last active user of this role',
  },
  selfChange: {
    kind: 'forbidden',
    code: 'self_change',
    message: 'You cannot deactivate or change the role of your own account',
  },
} as const satisfies Record<string, Denial>;

const allow: Decision = { ok: true };
const deny = (denial: Denial): Decision => ({ ok: false, denial });

export function authorizeTargetEdit(
  actor: PublicUser,
  target: PublicUser,
): Decision {
  return withinScope(actor, target) ? allow : deny(DENIALS.outOfScope);
}

function removesFromRole(target: PublicUser, change: UserChange): boolean {
  if ('status' in change) return change.status === 'deactivated';
  if ('role' in change) return change.role !== target.role;
  throw new Error('Unknown user change');
}

function removesLastActiveOfProtectedRole(
  target: PublicUser,
  change: UserChange,
  users: Iterable<PublicUser>,
): boolean {
  if (target.status !== 'active') return false;
  if (!policyFor(target.role).keepOneActive) return false;
  if (!removesFromRole(target, change)) return false;
  for (const other of users) {
    if (
      other.id !== target.id &&
      other.status === 'active' &&
      other.role === target.role
    ) {
      return false;
    }
  }
  return true;
}

export function authorizeUserChange(
  actor: PublicUser,
  target: PublicUser,
  change: UserChange,
  users: Iterable<PublicUser>,
): Decision {
  const scope = authorizeTargetEdit(actor, target);
  if (!scope.ok) return scope;
  if (removesLastActiveOfProtectedRole(target, change, users)) {
    return deny(DENIALS.lastActiveInRole);
  }
  if (target.id === actor.id && removesFromRole(target, change)) {
    return deny(DENIALS.selfChange);
  }
  return allow;
}
