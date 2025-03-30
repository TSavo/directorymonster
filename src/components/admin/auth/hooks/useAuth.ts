'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../../users/hooks/useUsers';
import { ResourceType, Permission, hasPermission as checkPermission } from '../utils/accessControl';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Enhanced authentication hook with ACL support
 */
export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check authentication status
        const response = await fetch('/api/auth/session');
        
        if (!response.ok) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Failed to fetch authentication status',
          });
          return;
        }
        
        const data = await response.json();
        
        if (data.authenticated && data.user) {
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication check failed',
        });
      }
    };
    
    checkAuthStatus();
  }, []);

  /**
   * Login with credentials
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      
      return false;
    }
  }, []);

  /**
   * Logout the user
   */
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      // Redirect to login page
      router.push('/login');
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Logout failed',
      }));
      
      return false;
    }
  }, [router]);

  /**
   * Check if user has permission for a specific resource
   */
  const hasPermission = useCallback((
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string,
    siteId?: string
  ): boolean => {
    const { user, isAuthenticated } = authState;
    
    if (!isAuthenticated || !user || !user.acl) {
      return false;
    }
    
    return checkPermission(user.acl, resourceType, permission, resourceId, siteId);
  }, [authState]);

  // Return the auth state and methods
  return {
    ...authState,
    login,
    logout,
    hasPermission,
  };
};

export default useAuth;
