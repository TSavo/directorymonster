'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Define types for the auth hook
export interface User {
  id: string;
  name?: string;
  email?: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for authentication functionality
 * This hook provides authentication state and methods for the application
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
      router.push('/admin/login');
      
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
   * Check if the user has permission for a specific action
   */
  const hasPermission = useCallback((action: string, resourceId?: string, ownerId?: string) => {
    const { user, isAuthenticated } = authState;
    
    if (!isAuthenticated || !user) {
      return false;
    }
    
    // Admin has all permissions
    if (user.role === 'admin') {
      return true;
    }
    
    // Editor can view everything and edit their own content
    if (user.role === 'editor') {
      if (action === 'view') {
        return true;
      }
      
      if (action === 'edit' && ownerId === user.id) {
        return true;
      }
    }
    
    // Viewer can only view content
    if (user.role === 'viewer') {
      return action === 'view';
    }
    
    return false;
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