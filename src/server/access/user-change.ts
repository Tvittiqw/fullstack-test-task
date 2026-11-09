import type { PublicUser, UserStatus } from '@/shared/api-types';
import type { Role } from '@/shared/roles';
import { can } from './authorize';

export type Denial = {
  kind: 'forbidden' | 'conflict';
  code: string;
  message: string;
};

export type Decision = { ok: true } | { ok: false; denial: Denial };

export type UserChange = { role: Role } | { status: UserStatus };

export const DENIALS = {
  lastActiveIt: {
    kind: 'conflict',
    code: 'last_active_it',
    message: 'Cannot remove the last active IT user',
  },
  selfChange: {
    kind: 'forbidden',
    code: 'self_change',
    message: 'You cannot deactivate or change the role of your own account',
  },
} as const satisfies Record<string, Denial>;

function removesTarget(target: PublicUser, change: UserChange): boolean {
  if ('status' in change) return change.status === 'deactivated';
  if ('role' in change) return change.role !== target.role;
  return change satisfies never;
}

function removesLastActiveAdmin(
  target: PublicUser,
  change: UserChange,
  users: Iterable<PublicUser>,
): boolean {
  if (target.status !== 'active') return false;
  if (!can(target, 'users.changeStatus')) return false;
  if (!removesTarget(target, change)) return false;
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

const deny = (denial: Denial): Decision => ({ ok: false, denial });

export function authorizeUserChange(
  actor: PublicUser,
  target: PublicUser,
  change: UserChange,
  users: Iterable<PublicUser>,
): Decision {
  if (removesLastActiveAdmin(target, change, users)) {
    return deny(DENIALS.lastActiveIt);
  }
  if (target.id === actor.id && removesTarget(target, change)) {
    return deny(DENIALS.selfChange);
  }
  return { ok: true };
}
