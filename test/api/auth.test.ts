import { beforeEach, describe, expect, it } from 'vitest';
import { POST as login } from '@/app/api/auth/login/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { GET as me } from '@/app/api/auth/me/route';
import { findSession } from '@/server/auth/sessions';
import { getStore, resetStore } from '@/server/store/store';
import { ctx, loginAs, req } from '../helpers/api';

beforeEach(() => {
  resetStore();
});

const postLogin = (body: unknown) =>
  login(req('POST', '/api/auth/login', { body }), ctx({}));
const getMe = (cookie?: string) =>
  me(req('GET', '/api/auth/me', { cookie }), ctx({}));

describe('POST /api/auth/login', () => {
  it('200 with Me and a session cookie for valid credentials', async () => {
    const res = await postLogin({
      email: 'ivan@example.com',
      password: 'ivan123',
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(
      /^session=[^;]+; Path=\/; HttpOnly; SameSite=Lax$/,
    );
    expect(await res.json()).toMatchObject({
      user: { id: 'u-ivan', email: 'ivan@example.com' },
      permissions: expect.arrayContaining(['users.create']) as unknown,
      landingRoute: '/manage-users',
    });
  });

  it('is case-insensitive on email', async () => {
    const res = await postLogin({
      email: 'IVAN@Example.com',
      password: 'ivan123',
    });
    expect(res.status).toBe(200);
  });

  it('401 invalid_credentials for a wrong password or a deactivated user', async () => {
    const wrong = await postLogin({
      email: 'ivan@example.com',
      password: 'nope',
    });
    const deactivated = await postLogin({
      email: 'yurii@example.com',
      password: 'yurii123',
    });
    expect(wrong.status).toBe(401);
    expect(deactivated.status).toBe(401);
    expect(await deactivated.json()).toMatchObject({
      error: { code: 'invalid_credentials' },
    });
  });

  it('400 validation for missing fields', async () => {
    const res = await postLogin({ email: 'ivan@example.com' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: 'validation' } });
  });
});

describe('GET /api/auth/me', () => {
  it('401 without a cookie or with an unknown token', async () => {
    expect((await getMe()).status).toBe(401);
    expect((await getMe('session=nope')).status).toBe(401);
  });

  it('200 Me with a valid cookie', async () => {
    const cookie = await loginAs('anna@example.com');
    const res = await getMe(cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      user: { id: 'u-anna' },
      landingRoute: '/content',
    });
  });

  it('401 once the user is deactivated, and the session is gone', async () => {
    const cookie = await loginAs('olena@example.com');
    const olena = getStore().users.get('u-olena');
    if (!olena) throw new Error('missing seed user');
    olena.status = 'deactivated';

    const res = await getMe(cookie);

    expect(res.status).toBe(401);
    expect(findSession(cookie.replace('session=', ''))).toBeUndefined();
  });
});

describe('POST /api/auth/logout', () => {
  it('204, clears the cookie, and me is 401 afterwards', async () => {
    const cookie = await loginAs('ivan@example.com');
    const res = await logout(
      req('POST', '/api/auth/logout', { cookie }),
      ctx({}),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('set-cookie')).toMatch(/^session=; .*Max-Age=0/);
    expect((await getMe(cookie)).status).toBe(401);
  });
});
