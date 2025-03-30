'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import jwt from 'jsonwebtoken';

// Define user type
interface User {
  username: string;
  role: string;
  id: string;
  lastLogin?: number;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  login: (token: string) => void;
  logout: () => void;
  canAccess: (role: string) => boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isRefreshing: false,
  login: () => {},
  logout: () => {},
  canAccess: () => false,
});

// Define role hierarchy for permission checking
const roleHierarchy: Record<string, string[]> = {
  admin: ['admin', 'editor', 'viewer'],
  editor: ['editor', 'viewer'],
  viewer: ['viewer'],
};

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

interface SessionManagerProps {
  children: ReactNode;
  redirectToLogin?: boolean;
  loginPath?: string;
}

export function SessionManager({
  children,
  redirectToLogin = false,
  loginPath = '/login',
}: SessionManagerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const router = useRouter();
  
  // Check token expiration and refresh if needed
  const checkTokenExpiration = async (token: string) => {
    try {
      const decoded = jwt.decode(token) as { exp?: number } | null;
      
      if (!decoded || !decoded.exp) {
        return false;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      
      // If token is expired, logout
      if (timeUntilExpiry <= 0) {
        logout();
        return false;
      }
      
      // If token expires in less than 10 minutes, refresh it
      if (timeUntilExpiry < 600) {
        return await refreshToken(token);
      }
      
      return true;
    } catch (error) {
      console.error('Token check error:', error);
      return false;
    }
  };
  
  // Refresh the token
  const refreshToken = async (currentToken: string): Promise<boolean> => {
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        login(data.token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Login handler
  const login = (token: string) => {
    try {
      const decoded = jwt.decode(token) as {
        username: string;
        role: string;
        userId: string;
      } | null;
      
      if (decoded) {
        setUser({
          username: decoded.username,
          role: decoded.role,
          id: decoded.userId,
        });
        
        setIsAuthenticated(true);
        localStorage.setItem('authToken', token);
      }
    } catch (error) {
      console.error('Login error:', error);
      logout();
    }
  };
  
  // Logout handler
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    
    if (redirectToLogin) {
      router.push(loginPath);
    }
  };
  
  // Check if user can access resources with specific role
  const canAccess = (requiredRole: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    const allowedRoles = roleHierarchy[user.role] || [];
    return allowedRoles.includes(requiredRole);
  };
  
  // Check authentication on mount and when localStorage changes
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        const isValid = await checkTokenExpiration(token);
        
        if (!isValid) {
          logout();
        }
      } else if (redirectToLogin) {
        router.push(loginPath);
      }
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage events (e.g., other tabs logging in/out)
    const handleStorageChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up periodic check (every minute)
    const intervalId = setInterval(checkAuth, 60000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [redirectToLogin, router]);
  
  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    isRefreshing,
    login,
    logout,
    canAccess,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Add default export for dual-export pattern
export default SessionManager;
