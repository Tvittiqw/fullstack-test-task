import type { Client, Paginated } from '@/shared/api-types';
import { apiFetch } from '@/ui/api-client';
import { PAGE_LIMIT } from '@/ui/paging';

export const clientsApi = {
  page: (page: number) =>
    apiFetch<Paginated<Client>>(
      `/api/clients?page=${page}&limit=${PAGE_LIMIT}`,
    ),
};
