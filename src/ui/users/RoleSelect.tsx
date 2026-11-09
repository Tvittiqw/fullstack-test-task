'use client';

import type { PublicUser } from '@/shared/api-types';
import { ROLES } from '@/shared/roles';
import { SelectField } from '@/ui/primitives/SelectField';
import type { RunAction } from './users-queries';
import { usersApi } from './users-api';

type RoleSelectProps = {
  user: PublicUser;
  disabled: boolean;
  run: RunAction;
  onChanged: () => void;
};

export function RoleSelect({
  user,
  disabled,
  run,
  onChanged,
}: RoleSelectProps) {
  async function change(value: string) {
    const role = ROLES.find((candidate) => candidate === value);
    if (!role || role === user.role) return;
    if (await run(() => usersApi.changeRole(user.id, role))) onChanged();
  }

  return (
    <SelectField
      label={`Role of ${user.fullName}`}
      labelHidden
      size="sm"
      value={user.role}
      disabled={disabled}
      onChange={(event) => void change(event.target.value)}
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </SelectField>
  );
}
