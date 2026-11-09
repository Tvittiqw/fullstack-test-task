import type { Client, Paginated } from '@/shared/api-types';
import { notFound } from '@/server/http/errors';
import { findClient, pageClients } from './clients.repository';
import type { ListClientsQuery } from './clients.schema';

export function listClients(query: ListClientsQuery): Paginated<Client> {
  return pageClients(query.page, query.limit);
}

export function getClient(id: string): Client {
  const client = findClient(id);
  if (!client) throw notFound('Client');
  return client;
}
