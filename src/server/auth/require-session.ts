import type { PublicUser } from '@/shared/api-types';
import { unauthenticated } from '@/server/http/errors';
import { findUser } from '@/server/users/users.repository';
import { readSessionToken } from './session-cookie';
import { deleteSession, findSession } from './sessions';

export function requireSession(request: Request): PublicUser {
  const token = readSessionToken(request.headers.get('cookie'));
  const session = token ? findSession(token) : undefined;
  if (!token || !session) throw unauthenticated();
  const user = findUser(session.userId);
  if (!user || user.status !== 'active') {
    deleteSession(token);
    throw unauthenticated();
  }
  return user;
}
