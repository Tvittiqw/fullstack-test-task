import { pageAccess } from '@/server/page-auth';
import { dateOnly } from '@/ui/format';
import { Forbidden } from '@/ui/layout/Forbidden';
import { Badge } from '@/ui/primitives/Badge';
import { DetailsList, type DetailsRow } from '@/ui/primitives/DetailsList';
import { PageHeader } from '@/ui/primitives/PageHeader';

export default async function MePage() {
  const { me, allowed } = await pageAccess('content.view');
  if (!allowed) return <Forbidden me={me} />;
  const { user } = me;
  const rows: DetailsRow[] = [
    { label: 'Name', value: user.fullName },
    { label: 'Email', value: user.email },
    { label: 'Role', value: <Badge kind="role" value={user.role} /> },
    { label: 'Status', value: <Badge kind="status" value={user.status} /> },
    { label: 'Member since', value: dateOnly(user.createdAt) },
  ];
  return (
    <>
      <PageHeader title="My account" />
      <section className="card">
        <DetailsList rows={rows} />
      </section>
    </>
  );
}
