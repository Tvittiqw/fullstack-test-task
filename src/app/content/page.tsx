import { pageAccess } from '@/server/page-auth';
import { ClientsTable } from '@/ui/clients/ClientsTable';
import { Forbidden } from '@/ui/layout/Forbidden';
import { parsePage } from '@/ui/paging';
import { PageHeader } from '@/ui/primitives/PageHeader';

type ContentPageProps = { searchParams: Promise<{ page?: string }> };

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const { me, allowed } = await pageAccess('content.view');
  if (!allowed) return <Forbidden me={me} />;
  const { page } = await searchParams;
  return (
    <>
      <PageHeader title="Clients" />
      <section className="card card--flush">
        <ClientsTable initialPage={parsePage(page)} />
      </section>
    </>
  );
}
