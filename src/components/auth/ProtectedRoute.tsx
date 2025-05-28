
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element | null => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the intended path to redirect after login
      // localStorage.setItem('grindset_redirectPath', pathname); // Optional: advanced redirect logic
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    // Show a full-page loading skeleton or spinner
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
    return null; // Or a loading spinner, or redirect is handled by useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
