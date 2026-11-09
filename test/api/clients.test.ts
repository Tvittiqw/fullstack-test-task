import { beforeEach, describe, expect, it } from 'vitest';
import { GET as list } from '@/app/api/clients/route';
import { GET as detail } from '@/app/api/clients/[id]/route';
import { CLIENT_COUNT } from '@/server/store/seed/clients.generator';
import { getStore, resetStore } from '@/server/store/store';
import { ctx, loginAs, req } from '../helpers/api';

beforeEach(() => {
  resetStore();
});

const getClients = (query: string, cookie?: string) =>
  list(req('GET', `/api/clients${query}`, { cookie }), ctx({}));
const page = async (res: Response) =>
  (await res.json()) as {
    items: { id: string }[];
    total: number;
    page: number;
    limit: number;
  };

describe('GET /api/clients', () => {
  it('401 without a cookie, 403 for IT', async () => {
    expect((await getClients('')).status).toBe(401);
    expect(
      (await getClients('', await loginAs('ivan@example.com'))).status,
    ).toBe(403);
  });

  it('returns one page per request with the total', async () => {
    const anna = await loginAs('anna@example.com');
    const first = await page(await getClients('', anna));
    expect(first).toMatchObject({ total: CLIENT_COUNT, page: 1, limit: 25 });
    expect(first.items).toHaveLength(25);

    const second = await page(await getClients('?page=2&limit=10', anna));
    expect(second).toMatchObject({ page: 2, limit: 10 });
    expect(second.items).toHaveLength(10);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it('400 validation for page=0, page=abc and limit=101', async () => {
    const anna = await loginAs('anna@example.com');
    for (const query of ['?page=0', '?page=abc', '?limit=101']) {
      const res = await getClients(query, anna);
      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({ error: { code: 'validation' } });
    }
  });

  it('200 with empty items for a page past the end', async () => {
    const res = await getClients(
      '?page=999',
      await loginAs('olena@example.com'),
    );
    expect(res.status).toBe(200);
    expect(await page(res)).toMatchObject({ items: [], total: CLIENT_COUNT });
  });
});

describe('GET /api/clients/:id', () => {
  it('200 for a known id, 404 for an unknown one', async () => {
    const olena = await loginAs('olena@example.com');
    const first = getStore().clients[0];
    if (!first) throw new Error('no clients');
    const ok = await detail(
      req('GET', `/api/clients/${first.id}`, { cookie: olena }),
      ctx({ id: first.id }),
    );
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual(first);
    const missing = await detail(
      req('GET', '/api/clients/nope', { cookie: olena }),
      ctx({ id: 'nope' }),
    );
    expect(missing.status).toBe(404);
  });
});
