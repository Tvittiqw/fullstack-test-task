'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { errorText } from '@/ui/api-client';
import { parsePage } from '@/ui/paging';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import { Pagination } from '@/ui/primitives/Pagination';
import { TableSkeleton } from '@/ui/primitives/TableSkeleton';
import { ClientRow } from './ClientRow';
import { useClientsPage } from './clients-queries';

const COLUMNS = ['Name', 'Company', 'Email', 'Country', 'Status', 'Created'];

type ClientsTableProps = { initialPage: number };

export function ClientsTable({ initialPage }: ClientsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const page = parsePage(searchParams.get('page') ?? initialPage);
  const { data, error, isPending } = useClientsPage(page);

  const rows = data?.items.map((client) => (
    <ClientRow key={client.id} client={client} />
  ));
  const empty = data !== undefined && data.items.length === 0;

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
            {isPending && <TableSkeleton columns={COLUMNS.length} />}
            {rows}
          </tbody>
        </table>
        {empty && <p className="empty">No clients on this page.</p>}
        <ErrorMessage error={error ? errorText(error) : null} block />
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
