import Link from 'next/link';
import { getClient } from '@/server/clients/clients.service';
import { pageAccess } from '@/server/page-auth';
import { loadOrNotFound } from '@/server/page-load';
import { dateOnly } from '@/ui/format';
import { Forbidden } from '@/ui/layout/Forbidden';
import { Badge } from '@/ui/primitives/Badge';
import { DetailsList, type DetailsRow } from '@/ui/primitives/DetailsList';
import { PageHeader } from '@/ui/primitives/PageHeader';

type ClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientPage({ params }: ClientPageProps) {
  const { me, allowed } = await pageAccess('content.view');
  if (!allowed) return <Forbidden me={me} />;
  const { id } = await params;
  const client = loadOrNotFound(() => getClient(id));

  const rows: DetailsRow[] = [
    { label: 'ID', value: client.id },
    { label: 'Company', value: client.company },
    { label: 'Email', value: client.email },
    { label: 'Country', value: client.country },
    { label: 'Status', value: <Badge kind="status" value={client.status} /> },
    { label: 'Created', value: dateOnly(client.createdAt) },
  ];

  return (
    <>
      <PageHeader
        title={client.name}
        action={
          <Link className="back-link" href="/content">
            ← Back to clients
          </Link>
        }
      />
      <section className="card">
        <DetailsList rows={rows} />
      </section>
    </>
  );
}
