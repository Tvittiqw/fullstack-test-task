import { redirect } from 'next/navigation';
import { policyFor } from '@/server/access/policy';
import { currentUser } from '@/server/page-auth';

export default async function Home() {
  const user = await currentUser();
  redirect(user ? policyFor(user.role).landingRoute : '/login');
}
