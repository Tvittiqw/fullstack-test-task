import type { PublicUser, UserStatus } from '@/shared/api-types';
import type { Role } from '@/shared/roles';
import { visibleUsers } from '@/server/access/authorize';
import { canManageReports, policyFor } from '@/server/access/policy';
import {
  authorizeTargetEdit,
  authorizeUserChange,
  type UserChange,
} from '@/server/access/user-change';
import {
  badRequest,
  conflict,
  fromDenial,
  notFound,
} from '@/server/http/errors';
import {
  findUser,
  findUserByEmail,
  insertUser,
  listUsers,
  updateUser,
} from './users.repository';
import type { CreateUserInput, UpdateProfileInput } from './users.schema';

export function listVisibleUsers(actor: PublicUser): PublicUser[] {
  return visibleUsers(actor, listUsers());
}

export function managerCandidates(): PublicUser[] {
  return listUsers().filter(
    (user) => user.status === 'active' && canManageReports(user.role),
  );
}

function assertEmailFree(email: string, ownerId?: string): void {
  const taken = findUserByEmail(email);
  if (taken && taken.id !== ownerId) {
    throw conflict('email_taken', 'A user with this email already exists');
  }
}

export function createUser(input: CreateUserInput): PublicUser {
  const managerId = input.managerId ?? null;
  if (managerId && policyFor(input.role).userScope !== null) {
    throw badRequest('invalid_manager', 'Only plain users can have a manager');
  }
  if (managerId && !managerCandidates().some((m) => m.id === managerId)) {
    throw badRequest('invalid_manager', 'managerId must be an active manager');
  }
  assertEmailFree(input.email);
  return insertUser({
    id: crypto.randomUUID(),
    fullName: input.fullName,
    email: input.email,
    password: input.password,
    role: input.role,
    status: 'active',
    managerId,
    createdAt: new Date().toISOString(),
  });
}

function loadTarget(id: string): PublicUser {
  const target = findUser(id);
  if (!target) throw notFound('User');
  return target;
}

export function updateProfile(
  actor: PublicUser,
  id: string,
  input: UpdateProfileInput,
): PublicUser {
  const target = loadTarget(id);
  const decision = authorizeTargetEdit(actor, target);
  if (!decision.ok) throw fromDenial(decision.denial);
  if (input.email) assertEmailFree(input.email, id);
  return updateUser(id, input);
}

function applyChange(
  actor: PublicUser,
  id: string,
  change: UserChange,
): PublicUser {
  const target = loadTarget(id);
  const decision = authorizeUserChange(actor, target, change, listUsers());
  if (!decision.ok) throw fromDenial(decision.denial);
  return updateUser(id, change);
}

export function changeRole(
  actor: PublicUser,
  id: string,
  role: Role,
): PublicUser {
  return applyChange(actor, id, { role });
}

export function changeStatus(
  actor: PublicUser,
  id: string,
  status: UserStatus,
): PublicUser {
  return applyChange(actor, id, { status });
}
