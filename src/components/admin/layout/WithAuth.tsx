'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WithAuthProps {
  children: React.ReactNode;
}

// This component wraps admin pages to provide authentication protection
// In a real implementation, this would check a session or token from an auth provider
export const WithAuth: React.FC<WithAuthProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // In a real implementation, this would check authentication state
    // For now, we'll simulate an authenticated user
    const checkAuth = async () => {
      try {
        // This would be a real auth check in production
        // await authService.checkSession();
        
        // For development, we'll assume the user is authenticated
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication failed:', error);
        setIsAuthenticated(false);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If authenticated, render the children
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // This shouldn't render as the router.push should navigate away
  return null;
};

export default WithAuth;