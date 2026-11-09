import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Me, PublicUser } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';
import { can } from './access/authorize';
import { toMe } from './auth/me';
import { SESSION_COOKIE } from './auth/session-cookie';
import { findSession } from './auth/sessions';
import { findUser } from './users/users.repository';

export async function currentUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? findSession(token) : undefined;
  const user = session ? findUser(session.userId) : undefined;
  return user && user.status === 'active' ? user : null;
}

export async function requirePageSession(): Promise<PublicUser> {
  const user = await currentUser();
  if (!user) redirect('/login?expired=1');
  return user;
}

export async function pageAccess(
  permission: Permission,
): Promise<{ me: Me; allowed: boolean }> {
  const user = await requirePageSession();
  return { me: toMe(user), allowed: can(user, permission) };
}
