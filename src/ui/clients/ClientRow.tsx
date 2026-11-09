'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Client } from '@/shared/api-types';
import { dateOnly } from '@/ui/format';
import { Badge } from '@/ui/primitives/Badge';

type ClientRowProps = { client: Client };

export function ClientRow({ client }: ClientRowProps) {
  const router = useRouter();
  const href = `/content/client/${client.id}`;
  return (
    <tr className="row--link" onClick={() => router.push(href)}>
      <td>
        <Link href={href}>{client.name}</Link>
      </td>
      <td>{client.company}</td>
      <td>{client.email}</td>
      <td>{client.country}</td>
      <td>
        <Badge kind="status" value={client.status} />
      </td>
      <td>{dateOnly(client.createdAt)}</td>
    </tr>
  );
}
