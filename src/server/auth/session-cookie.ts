export const SESSION_COOKIE = 'session';

const BASE_ATTRIBUTES = 'Path=/; HttpOnly; SameSite=Lax';

const secure = (): string =>
  process.env.NODE_ENV === 'production' ? '; Secure' : '';

export function readSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=') || null;
  }
  return null;
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; ${BASE_ATTRIBUTES}${secure()}`;
}

export function clearedSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${BASE_ATTRIBUTES}; Max-Age=0${secure()}`;
}
