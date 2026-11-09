'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Me } from '@/shared/api-types';
import type { Permission } from '@/shared/permissions';
import { SidebarUser } from './SidebarUser';

type NavLink = { href: string; label: string; permission: Permission };

const LINKS: NavLink[] = [
  { href: '/content', label: 'Content', permission: 'content.view' },
  { href: '/content/me', label: 'Me', permission: 'content.view' },
  { href: '/manage-users', label: 'Manage users', permission: 'users.list' },
];

type NavProps = { me: Me };

export function Nav({ me }: NavProps) {
  const pathname = usePathname();
  const links = LINKS.filter((link) =>
    me.permissions.includes(link.permission),
  );

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
      <SidebarUser user={me.user} />
    </aside>
  );
}
