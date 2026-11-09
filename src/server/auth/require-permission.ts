import type { PublicUser } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';
import { can } from '@/server/access/authorize';
import { forbidden } from '@/server/http/errors';
import { requireSession } from './require-session';

export function requirePermission(
  request: Request,
  permission: Permission,
): PublicUser {
  const user = requireSession(request);
  if (!can(user, permission)) throw forbidden();
  return user;
}
