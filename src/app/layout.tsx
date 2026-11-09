import type { Metadata } from 'next';
import { toMe } from '@/server/auth/me';
import { currentUser } from '@/server/page-auth';
import { Nav } from '@/ui/layout/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'User Management',
  description: 'Users directory and client content',
};

type RootLayoutProps = { children: React.ReactNode };

export default async function RootLayout({ children }: RootLayoutProps) {
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
