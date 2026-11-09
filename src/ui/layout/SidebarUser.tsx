'use client';

import type { PublicUser } from '@/shared/api-types';
import { apiFetch, hardNavigate } from '@/ui/api-client';
import { Badge } from '@/ui/primitives/Badge';

type SidebarUserProps = { user: PublicUser };

export function SidebarUser({ user }: SidebarUserProps) {
  async function logout() {
    await apiFetch<void>('/api/auth/logout', { method: 'POST' });
    hardNavigate('/login');
  }

  return (
    <div className="sidebar__user">
      <div>
        <div className="sidebar__name">{user.fullName}</div>
        <Badge kind="role" value={user.role} />
      </div>
      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => void logout()}
      >
        Log out
      </button>
    </div>
  );
}
