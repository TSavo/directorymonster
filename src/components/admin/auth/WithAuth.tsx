'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContainer } from './AuthContainer';

interface WithAuthProps {
  children: ReactNode;
  requiredRole?: string;
  redirectPath?: string;
}

/**
 * WithAuth component - Wraps content that should only be accessible to authenticated users
 * 
 * @param children - The content to render when authenticated
 * @param requiredRole - Optional role required to access the content
 * @param redirectPath - Where to redirect if authentication fails (defaults to /login)
 */
export function WithAuth({ 
  children, 
  requiredRole = 'admin', 
  redirectPath = '/login'
}: WithAuthProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check authentication status
        const authResponse = await fetch('/api/auth/session');
        
        if (!authResponse.ok) {
          setIsAuthenticated(false);
          setIsAuthorized(false);
          return;
        }
        
        const authData = await authResponse.json();
        
        // If not authenticated, set states and return
        if (!authData.authenticated) {
          setIsAuthenticated(false);
          setIsAuthorized(false);
          return;
        }
        
        // User is authenticated
        setIsAuthenticated(true);
        
        // Check authorization if required role is specified
        if (requiredRole) {
          // Check if user has the required role
          const hasRequiredRole = authData.user?.role === requiredRole;
          setIsAuthorized(hasRequiredRole);
        } else {
          // No specific role required, so user is authorized
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [requiredRole]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // For testing purposes - bypass authentication check 
  // This would be removed in production
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }
  
  // If not authenticated, show login form
  if (!isAuthenticated) {
    return <AuthContainer redirectPath={redirectPath} />;
  }
  
  // If authenticated but not authorized for the required role
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">
            You do not have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // If authenticated and authorized, render children
  return <>{children}</>;
}

// Also export as default for backward compatibility
export default WithAuth;