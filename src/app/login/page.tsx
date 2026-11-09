import { redirect } from 'next/navigation';
import { policyFor } from '@/server/access/policy';
import { currentUser } from '@/server/page-auth';
import { LoginForm } from '@/ui/components/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect(policyFor(user.role).landingRoute);
  const { expired } = await searchParams;
  return (
    <div className="auth">
      <div className="auth__card">
        <section className="card">
          <h1 className="page-title">Sign in</h1>
          <LoginForm clearStale={expired === '1'} />
        </section>
      </div>
    </div>
  );
}
