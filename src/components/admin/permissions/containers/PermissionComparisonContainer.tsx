"use client";

import React, { useState, useEffect } from 'react';
import { PermissionComparison } from '../PermissionComparison';
import { Role } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export function PermissionComparisonContainer() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles and users data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch roles
        const rolesResponse = await fetch('/api/admin/roles?limit=100');
        
        if (!rolesResponse.ok) {
          const errorData = await rolesResponse.json();
          throw new Error(errorData.error || 'Failed to fetch roles');
        }
        
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
        
        // Fetch users
        const usersResponse = await fetch('/api/admin/users?limit=100');
        
        if (!usersResponse.ok) {
          const errorData = await usersResponse.json();
          throw new Error(errorData.error || 'Failed to fetch users');
        }
        
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle export
  const handleExport = async (data: any) => {
    try {
      // Create a Blob with the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = 'permission-comparison.json';
      
      // Append the link to the document
      document.body.appendChild(link);
      
      // Click the link to trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setError(errorMessage);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PermissionComparison
      roles={roles}
      users={users}
      isLoading={isLoading}
      error={error}
      onExport={handleExport}
    />
  );
}

export default PermissionComparisonContainer;
