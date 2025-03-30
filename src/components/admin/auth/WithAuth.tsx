'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './hooks/useAuth';

interface WithAuthProps {
  children: ReactNode;
  loginPath?: string;
  loadingComponent?: ReactNode;
}

/**
 * Higher-Order Component that protects routes with authentication
 */
export function WithAuth({
  children,
  loginPath = '/login',
  loadingComponent = <DefaultLoadingComponent />
}: WithAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Detect client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isClient && !isLoading && !isAuthenticated) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(pathname);
      router.push(`${loginPath}?returnUrl=${returnUrl}`);
    }
  }, [isClient, isLoading, isAuthenticated, router, pathname, loginPath]);

  // Show loading state while checking authentication
  if (isLoading || !isClient) {
    return <>{loadingComponent}</>;
  }

  // Show content only if authenticated
  return isAuthenticated ? <>{children}</> : null;
}

function DefaultLoadingComponent() {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  );
}

export default WithAuth;
