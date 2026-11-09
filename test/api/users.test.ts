import { beforeEach, describe, expect, it } from 'vitest';
import { GET as me } from '@/app/api/auth/me/route';
import { GET as list, POST as create } from '@/app/api/users/route';
import { GET as managers } from '@/app/api/users/managers/route';
import { PATCH as editProfile } from '@/app/api/users/[id]/route';
import { PATCH as changeRole } from '@/app/api/users/[id]/role/route';
import { PATCH as changeStatus } from '@/app/api/users/[id]/status/route';
import { resetStore } from '@/server/store/store';
import { ctx, loginAs, req } from '../helpers/api';

beforeEach(() => {
  resetStore();
});

const ids = async (res: Response) => {
  const body = (await res.json()) as { items: { id: string }[] };
  return body.items.map((u) => u.id).sort();
};
const code = async (res: Response) => {
  const body = (await res.json()) as { error: { code: string } };
  return body.error.code;
};

const getUsers = (cookie?: string) =>
  list(req('GET', '/api/users', { cookie }), ctx({}));
const patch = (
  route: typeof editProfile,
  id: string,
  body: unknown,
  cookie: string,
) => route(req('PATCH', `/api/users/${id}`, { body, cookie }), ctx({ id }));

describe('GET /api/users', () => {
  it('401 without a cookie, 403 for a user without users.list', async () => {
    expect((await getUsers()).status).toBe(401);
    expect((await getUsers(await loginAs('olena@example.com'))).status).toBe(
      403,
    );
  });

  it('lists exactly the four direct reports for Anna', async () => {
    const res = await getUsers(await loginAs('anna@example.com'));
    expect(res.status).toBe(200);
    expect(await ids(res)).toEqual([
      'u-andrii',
      'u-kateryna',
      'u-mykola',
      'u-olena',
    ]);
  });

  it('lists everyone for Ivan and never includes a password', async () => {
    const res = await getUsers(await loginAs('ivan@example.com'));
    const text = await res.text();
    expect((JSON.parse(text) as { items: unknown[] }).items).toHaveLength(12);
    expect(text).not.toContain('ivan123');
    expect(text).not.toContain('password');
  });
});

describe('GET /api/users/managers', () => {
  it('returns the manager candidates for IT and 403 for a manager', async () => {
    const asIvan = await managers(
      req('GET', '/api/users/managers', {
        cookie: await loginAs('ivan@example.com'),
      }),
      ctx({}),
    );
    expect(await ids(asIvan)).toEqual(['u-anna', 'u-oksana']);
    const asAnna = await managers(
      req('GET', '/api/users/managers', {
        cookie: await loginAs('anna@example.com'),
      }),
      ctx({}),
    );
    expect(asAnna.status).toBe(403);
  });
});

describe('POST /api/users', () => {
  const body = {
    fullName: 'New User',
    email: 'new@example.com',
    password: 'new1234',
    role: 'user',
    managerId: 'u-anna',
  };

  it('403 for a manager, 201 for IT, 400 validation for a bad email', async () => {
    const asAnna = await create(
      req('POST', '/api/users', {
        body,
        cookie: await loginAs('anna@example.com'),
      }),
      ctx({}),
    );
    expect(asAnna.status).toBe(403);

    const ivan = await loginAs('ivan@example.com');
    const created = await create(
      req('POST', '/api/users', { body, cookie: ivan }),
      ctx({}),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      email: 'new@example.com',
      managerId: 'u-anna',
      status: 'active',
    });

    const bad = await create(
      req('POST', '/api/users', {
        body: { ...body, email: 'nope' },
        cookie: ivan,
      }),
      ctx({}),
    );
    expect(bad.status).toBe(400);
    expect(await code(bad)).toBe('validation');
  });
});

describe('PATCH /api/users/:id', () => {
  it('Anna cannot edit Dmytro but can edit Olena', async () => {
    const anna = await loginAs('anna@example.com');
    const denied = await patch(
      editProfile,
      'u-dmytro',
      { fullName: 'X' },
      anna,
    );
    expect(denied.status).toBe(403);
    expect(await code(denied)).toBe('out_of_scope');

    const ok = await patch(
      editProfile,
      'u-olena',
      { fullName: 'Olena B.' },
      anna,
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toMatchObject({
      id: 'u-olena',
      fullName: 'Olena B.',
    });
  });
});

describe('PATCH /api/users/:id/role and /status', () => {
  it('Anna cannot give herself IT: 403 by permission, before any self rule', async () => {
    const res = await patch(
      changeRole,
      'u-anna',
      { role: 'IT' },
      await loginAs('anna@example.com'),
    );
    expect(res.status).toBe(403);
    expect(await code(res)).toBe('forbidden');
  });

  it('Ivan: self 403 self_change, Petro 200, self again 409 last_active_it', async () => {
    const ivan = await loginAs('ivan@example.com');
    const first = await patch(
      changeStatus,
      'u-ivan',
      { status: 'deactivated' },
      ivan,
    );
    expect(first.status).toBe(403);
    expect(await code(first)).toBe('self_change');

    expect(
      (await patch(changeStatus, 'u-petro', { status: 'deactivated' }, ivan))
        .status,
    ).toBe(200);

    const again = await patch(
      changeStatus,
      'u-ivan',
      { status: 'deactivated' },
      ivan,
    );
    expect(again.status).toBe(409);
    expect(await code(again)).toBe('last_active_it');
  });

  it('deactivating Olena makes her next request fail with 401', async () => {
    const olena = await loginAs('olena@example.com');
    expect(
      (await me(req('GET', '/api/auth/me', { cookie: olena }), ctx({}))).status,
    ).toBe(200);

    const ivan = await loginAs('ivan@example.com');
    expect(
      (await patch(changeStatus, 'u-olena', { status: 'deactivated' }, ivan))
        .status,
    ).toBe(200);

    expect(
      (await me(req('GET', '/api/auth/me', { cookie: olena }), ctx({}))).status,
    ).toBe(401);
  });
});
