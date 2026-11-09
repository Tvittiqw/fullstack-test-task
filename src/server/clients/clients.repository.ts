import type { Client, Paginated } from '@/shared/api-types';
import { getStore } from '@/server/store/store';

export function pageClients(page: number, limit: number): Paginated<Client> {
  const { clients } = getStore();
  const offset = (page - 1) * limit;
  return {
    items: clients.slice(offset, offset + limit),
    total: clients.length,
    page,
    limit,
  };
}

export function findClient(id: string): Client | undefined {
  return getStore().clients.find((client) => client.id === id);
}
