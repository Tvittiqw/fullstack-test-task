'use client';

import type { PublicUser } from '@/shared/api-types';
import { useLogout } from '@/ui/auth/auth-queries';
import { Badge } from '@/ui/primitives/Badge';
import { Button } from '@/ui/primitives/Button';

type SidebarUserProps = { user: PublicUser };

export function SidebarUser({ user }: SidebarUserProps) {
  const logout = useLogout();

  return (
    <div className="sidebar__user">
      <div>
        <div className="sidebar__name">{user.fullName}</div>
        <Badge kind="role" value={user.role} />
      </div>
      <Button
        size="sm"
        onClick={() => logout.mutate()}
        pending={logout.isPending}
      >
        Log out
      </Button>
    </div>
  );
}
