import Link from 'next/link';
import type { Me } from '@/shared/api-types';

type ForbiddenProps = { me: Me };

export function Forbidden({ me }: ForbiddenProps) {
  return (
    <section className="card">
      <h1 className="page-title">
        403 — your role ({me.user.role}) cannot access this page
      </h1>
      <p className="muted">
        <Link href={me.landingRoute}>Go to your start page</Link>
      </p>
    </section>
  );
}
