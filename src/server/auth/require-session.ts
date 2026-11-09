import type { PublicUser } from '@/shared/api-types';
import { unauthenticated } from '@/server/http/errors';
import { getStore } from '@/server/store/store';
import { toPublic } from './credentials';
import { readSessionToken } from './session-cookie';
import { deleteSession, findSession } from './sessions';

export function requireSession(request: Request): PublicUser {
  const token = readSessionToken(request.headers.get('cookie'));
  const session = token ? findSession(token) : undefined;
  if (!token || !session) throw unauthenticated();
  const user = getStore().users.get(session.userId);
  if (!user || user.status !== 'active') {
    deleteSession(token);
    throw unauthenticated();
  }
  return toPublic(user);
}
