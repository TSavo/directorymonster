'use client';

import React, { useState, useEffect } from 'react';
import { ZKPLogin } from './ZKPLogin';
import { FirstUserSetup } from './FirstUserSetup';

interface AuthContainerProps {
  redirectPath?: string;
}

export function AuthContainer({ redirectPath = '/admin' }: AuthContainerProps) {
  // State for checking users
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if any users exist when the component mounts
  useEffect(() => {
    const checkForUsers = async () => {
      try {
        setIsLoading(true);
        console.log('[AuthContainer] Checking for users...');
        
        // Get CSRF token or generate one
        const getCsrfToken = (): string => {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrf_token') {
              return value;
            }
          }
      
          // If no CSRF token is found, generate one and set it
          const newToken = Math.random().toString(36).substring(2, 15) + 
                          Math.random().toString(36).substring(2, 15);
          
          // Set the cookie
          document.cookie = `csrf_token=${newToken}; path=/; max-age=3600; SameSite=Strict`;
          
          return newToken;
        };
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        console.log('[AuthContainer] Got CSRF token');
        
        // Make API request to check if users exist
        console.log('[AuthContainer] Calling /api/auth/check-users');
        const response = await fetch('/api/auth/check-users', {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[AuthContainer] Response from check-users:', data);
          setHasUsers(data.hasUsers);
        } else {
          // If there's an error, assume users exist for security
          // This prevents bypassing login if the API is down
          console.error('[AuthContainer] Error checking for users:', response.statusText);
          setHasUsers(true);
          setError('Error checking system status. Please try again later.');
        }
      } catch (err) {
        console.error('[AuthContainer] Error checking for users:', err);
        // Assume users exist for security
        setHasUsers(true);
        setError('Error checking system status. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkForUsers();
  }, []);
  
  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Checking system status...</p>
      </div>
    );
  }
  
  // Show error if there was a problem
  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
        </div>
        <p className="text-center">
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </p>
      </div>
    );
  }
  
  // Show setup form if no users exist, otherwise show login form
  return (
    <div>
      {hasUsers === false ? (
        <FirstUserSetup redirectPath={redirectPath} />
      ) : (
        <ZKPLogin redirectPath={redirectPath} />
      )}
    </div>
  );
}

// Add default export for dual-export pattern
export default AuthContainer;
