'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken } from '@/utils/token-utils';

// Define user type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Verify token with server
        const response = await fetch('/api/auth/verify', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);

          // Also try to decode the token directly
          const payload = decodeToken(token);
          if (payload?.user && !data.user) {
            setUser(payload.user);
            setIsAuthenticated(true);
          } else if (!payload && !data.user) {
            // If token decoding fails and no user data from API, set not authenticated
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Clear invalid token
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = (token: string) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);

    // Decode token to get user info (in a real app, you'd verify this on the server)
    const payload = decodeToken(token);
    if (payload?.user) {
      setUser(payload.user);
    } else {
      console.error('Error decoding token: Invalid or missing user data');
      // If token decoding fails, set not authenticated
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
