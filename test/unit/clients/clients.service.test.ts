import { beforeEach, describe, expect, it } from 'vitest';
import { getClient, listClients } from '@/server/clients/clients.service';
import { CLIENT_COUNT } from '@/server/store/seed/clients.generator';
import { getStore, resetStore } from '@/server/store/store';

beforeEach(() => {
  resetStore();
});

describe('listClients', () => {
  it('returns the first page in store order with the total', () => {
    const result = listClients({ page: 1, limit: 25 });
    expect(result).toMatchObject({ total: CLIENT_COUNT, page: 1, limit: 25 });
    expect(result.items).toEqual(getStore().clients.slice(0, 25));
  });

  it('returns the last page, then an empty page past the end', () => {
    expect(listClients({ page: 48, limit: 25 }).items).toHaveLength(25);
    expect(listClients({ page: 49, limit: 25 })).toMatchObject({
      items: [],
      total: CLIENT_COUNT,
    });
  });

  it('honours the limit boundary', () => {
    expect(listClients({ page: 12, limit: 100 }).items).toHaveLength(100);
    expect(listClients({ page: 13, limit: 100 }).items).toHaveLength(0);
  });
});

describe('getClient', () => {
  it('returns a client by id and 404 for an unknown id', () => {
    const first = getStore().clients[0];
    if (!first) throw new Error('no clients');
    expect(getClient(first.id)).toEqual(first);
    expect(() => getClient('nope')).toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });
});
