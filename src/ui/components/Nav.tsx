'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { Me } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';
import { apiFetch } from '@/ui/api-client';

const LINKS: { href: string; label: string; permission: Permission }[] = [
  { href: '/content', label: 'Content', permission: 'content.view' },
  { href: '/content/me', label: 'Me', permission: 'content.view' },
  { href: '/manage-users', label: 'Manage users', permission: 'users.list' },
];

export function Nav({ me }: { me: Me }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = LINKS.filter((link) =>
    me.permissions.includes(link.permission),
  );

  async function logout() {
    await apiFetch<void>('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" />
        <span>User Management</span>
      </div>
      <nav className="sidebar__nav">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="sidebar__link"
            aria-current={pathname === link.href ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar__user">
        <div>
          <div className="sidebar__name">{me.user.fullName}</div>
          <span className="badge badge--role">{me.user.role}</span>
        </div>
        <button
          type="button"
          className="btn btn--secondary btn--sm"
          onClick={() => void logout()}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
