'use client';

import { useAuthContext } from '@/components/auth';
import { Navbar } from './navbar';
import { Skeleton } from '@/components/ui/skeleton';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white border-b">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="container mx-auto py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Don't show navbar for unauthenticated users
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}