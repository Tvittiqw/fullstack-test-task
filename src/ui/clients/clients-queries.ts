import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/ui/query-keys';
import { clientsApi } from './clients-api';

export function useClientsPage(page: number) {
  return useQuery({
    queryKey: queryKeys.clients(page),
    queryFn: () => clientsApi.page(page),
  });
}
