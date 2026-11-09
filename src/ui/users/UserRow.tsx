'use client';

import { useState } from 'react';
import type { PublicUser } from '@/shared/api-types';
import { Badge } from '@/ui/primitives/Badge';
import { Button } from '@/ui/primitives/Button';
import { ErrorMessage } from '@/ui/primitives/ErrorMessage';
import type { UserAbilities } from './abilities';
import { ProfileEditor } from './ProfileEditor';
import { RoleSelect } from './RoleSelect';
import { StatusButton } from './StatusButton';
import { useUserMutation } from './users-queries';

type UserRowProps = {
  user: PublicUser;
  managerName: string | null;
  abilities: UserAbilities;
  columns: number;
};

export function UserRow({
  user,
  managerName,
  abilities,
  columns,
}: UserRowProps) {
  const [editing, setEditing] = useState(false);
  const { run, pending, error } = useUserMutation();

  const changed = () => setEditing(false);

  const rowClass = [
    editing ? 'row--editing' : '',
    error ? 'row--has-error' : '',
  ].join(' ');

  return (
    <>
      <tr className={rowClass}>
        {editing ? (
          <ProfileEditor
            user={user}
            pending={pending}
            run={run}
            onSaved={changed}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <td>{user.fullName}</td>
            <td>{user.email}</td>
          </>
        )}
        <td>
          {abilities.changeRole ? (
            <RoleSelect
              user={user}
              disabled={pending}
              run={run}
              onChanged={changed}
            />
          ) : (
            <Badge kind="role" value={user.role} />
          )}
        </td>
        <td>
          <Badge kind="status" value={user.status} />
        </td>
        <td>{managerName ?? '—'}</td>
        <td className="cell-actions">
          {abilities.editProfile && !editing && (
            <Button size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
          {abilities.changeStatus && (
            <StatusButton
              user={user}
              disabled={pending}
              run={run}
              onChanged={changed}
            />
          )}
        </td>
      </tr>
      {error && (
        <tr className="row--error">
          <td colSpan={columns}>
            <ErrorMessage error={error} />
          </td>
        </tr>
      )}
    </>
  );
}
