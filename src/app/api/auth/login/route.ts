import { loginSchema } from '@/shared/schemas/auth';
import { authenticate } from '@/server/auth/credentials';
import { toMe } from '@/server/auth/me';
import { sessionCookie } from '@/server/auth/session-cookie';
import { createSession } from '@/server/auth/sessions';
import { parseBody } from '@/server/http/body';
import { invalidCredentials } from '@/server/http/errors';
import { handle } from '@/server/http/handle';
import { json } from '@/server/http/respond';

export const POST = handle(async (request) => {
  const { email, password } = await parseBody(request, loginSchema);
  const user = authenticate(email, password);
  if (!user) throw invalidCredentials();
  const session = createSession(user.id);
  return json(toMe(user), 200, { 'Set-Cookie': sessionCookie(session.token) });
});
