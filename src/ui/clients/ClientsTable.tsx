'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Client, Paginated } from '@/shared/api-types';
import { useApiQuery } from '@/ui/hooks/useApiQuery';
import { PAGE_LIMIT, parsePage } from '@/ui/paging';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import { Pagination } from '@/ui/primitives/Pagination';
import { TableSkeleton } from '@/ui/primitives/TableSkeleton';
import { ClientRow } from './ClientRow';

const COLUMNS = ['Name', 'Company', 'Email', 'Country', 'Status', 'Created'];

type ClientsTableProps = { initialPage: number };

export function ClientsTable({ initialPage }: ClientsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get('page') ?? initialPage);
  const { data, error, loading } = useApiQuery<Paginated<Client>>(
    `/api/clients?page=${page}&limit=${PAGE_LIMIT}`,
  );

  const rows = data?.items.map((client) => (
    <ClientRow key={client.id} client={client} />
  ));
  const empty = data !== null && data.items.length === 0;

  function goTo(next: number) {
    router.push(`${pathname}?page=${next}`);
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <TableSkeleton columns={COLUMNS.length} />}
            {rows}
          </tbody>
        </table>
        {empty && <p className="empty">No clients on this page.</p>}
        <ErrorMessage error={error} block />
      </div>
      {data && (
        <Pagination
          page={data.page}
          limit={data.limit}
          total={data.total}
          onChange={goTo}
        />
      )}
    </>
  );
}
