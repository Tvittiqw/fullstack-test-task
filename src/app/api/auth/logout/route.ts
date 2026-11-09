import {
  clearedSessionCookie,
  readSessionToken,
} from '@/server/auth/session-cookie';
import { deleteSession } from '@/server/auth/sessions';
import { handle } from '@/server/http/handle';
import { noContent } from '@/server/http/respond';

export const POST = handle((request) => {
  const token = readSessionToken(request.headers.get('cookie'));
  if (token) deleteSession(token);
  return noContent({ 'Set-Cookie': clearedSessionCookie() });
});
