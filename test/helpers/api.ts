import type { HandlerContext } from '@/server/http/handle';
import { POST as login } from '@/app/api/auth/login/route';

const BASE = 'http://localhost';

export function req(
  method: string,
  path: string,
  init: { body?: unknown; cookie?: string } = {},
): Request {
  const headers = new Headers();
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  if (init.cookie) headers.set('cookie', init.cookie);
  return new Request(`${BASE}${path}`, {
    method,
    headers,
    body: init.body === undefined ? null : JSON.stringify(init.body),
  });
}

export function ctx<P>(params: P): HandlerContext<P> {
  return { params: Promise.resolve(params) };
}

export async function loginAs(email: string): Promise<string> {
  const name = email.split('@')[0];
  const res = await login(
    req('POST', '/api/auth/login', { body: { email, password: `${name}123` } }),
    ctx({}),
  );
  if (res.status !== 200) throw new Error(`login failed for ${email}`);
  const setCookie = res.headers.get('set-cookie') ?? '';
  return setCookie.split(';')[0] ?? '';
}
