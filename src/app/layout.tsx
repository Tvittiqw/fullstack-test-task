import type { Metadata } from 'next';
import { toMe } from '@/server/auth/me';
import { currentUser } from '@/server/page-auth';
import { Nav } from '@/ui/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Users directory and client content',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        {user ? (
          <div className="app">
            <Nav me={toMe(user)} />
            <main className="main">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
