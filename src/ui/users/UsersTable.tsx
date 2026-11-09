'use client';

import type { Me } from '@/shared/api-types';
import { errorText } from '@/ui/api-client';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import { TableSkeleton } from '@/ui/primitives/TableSkeleton';
import { userAbilities } from './abilities';
import { CreateUserForm } from './CreateUserForm';
import { UserRow } from './UserRow';
import { useUsers } from './users-queries';

const COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Manager', ''];

type UsersTableProps = { me: Me };

export function UsersTable({ me }: UsersTableProps) {
  const { data, error, isPending } = useUsers();
  const abilities = userAbilities(me);
  const users = data?.items ?? [];
  const names = new Map(users.map((user) => [user.id, user.fullName]));
  names.set(me.user.id, me.user.fullName);

  const rows = users.map((user) => (
    <UserRow
      key={user.id}
      user={user}
      managerName={user.managerId ? (names.get(user.managerId) ?? null) : null}
      abilities={abilities}
      columns={COLUMNS.length}
    />
  ));
  const empty = data !== undefined && users.length === 0;

  return (
    <>
      {abilities.create && (
        <section className="card">
          <h2 className="card__title">Create user</h2>
          <CreateUserForm />
        </section>
      )}
      <section className="card card--flush">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map((column, index) => (
                  <th key={index}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isPending && <TableSkeleton columns={COLUMNS.length} />}
              {rows}
            </tbody>
          </table>
          {empty && <p className="empty">No users in your scope.</p>}
          <ErrorMessage error={error ? errorText(error) : null} block />
        </div>
      </section>
    </>
  );
}
