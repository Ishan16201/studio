
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element | null => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log(`[ProtectedRoute Effect] isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, pathname: ${pathname}`);
    if (!isLoading && !isAuthenticated) {
      console.log(`[ProtectedRoute Effect] Redirecting to /login from ${pathname}`);
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    console.log('[ProtectedRoute Render] isLoading is true, rendering skeleton.');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute Render] isAuthenticated is false, rendering redirect message.');
    // Render a message instead of null to make it visible if redirection via useEffect is slow or problematic
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <p className="text-foreground">Redirecting to login...</p>
        </div>
    );
  }

  console.log('[ProtectedRoute Render] isAuthenticated is true, rendering children.');
  return <>{children}</>;
};

export default ProtectedRoute;
