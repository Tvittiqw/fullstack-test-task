import { pageAccess } from '@/server/page-auth';
import { Forbidden } from '@/ui/layout/Forbidden';
import { PageHeader } from '@/ui/primitives/PageHeader';
import { UsersTable } from '@/ui/users/UsersTable';

export default async function ManageUsersPage() {
  const { me, allowed } = await pageAccess('users.list');
  if (!allowed) return <Forbidden me={me} />;
  return (
    <>
      <PageHeader title="Manage users" />
      <UsersTable me={me} />
    </>
  );
}
