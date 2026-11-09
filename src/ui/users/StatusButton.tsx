'use client';

import type { PublicUser, UserStatus } from '@/shared/api-types';
import { Button } from '@/ui/primitives/Button';
import type { RunAction } from './users-queries';
import { usersApi } from './users-api';

type StatusButtonProps = {
  user: PublicUser;
  disabled: boolean;
  run: RunAction;
  onChanged: () => void;
};

export function StatusButton({
  user,
  disabled,
  run,
  onChanged,
}: StatusButtonProps) {
  const next: UserStatus = user.status === 'active' ? 'deactivated' : 'active';
  const deactivating = next === 'deactivated';

  async function change() {
    if (await run(() => usersApi.changeStatus(user.id, next))) onChanged();
  }

  return (
    <Button
      size="sm"
      variant={deactivating ? 'danger' : 'secondary'}
      disabled={disabled}
      onClick={() => void change()}
    >
      {deactivating ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
