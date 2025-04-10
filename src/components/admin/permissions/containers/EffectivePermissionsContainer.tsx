"use client";

import React, { useState, useEffect } from 'react';
import { EffectivePermissions } from '../EffectivePermissions';
import { Role, Permission } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface EffectivePermissionsContainerProps {
  userId: string;
}

export function EffectivePermissionsContainer({ userId }: EffectivePermissionsContainerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [effectivePermissions, setEffectivePermissions] = useState<Record<string, Permission[]>>({});
  const [permissionSources, setPermissionSources] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user and permissions data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch user details
        const userResponse = await fetch(`/api/admin/users/${userId}`);
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'Failed to fetch user');
        }
        
        const userData = await userResponse.json();
        setUser(userData.user);
        
        // Fetch user roles
        const rolesResponse = await fetch(`/api/admin/users/${userId}/roles`);
        
        if (!rolesResponse.ok) {
          const errorData = await rolesResponse.json();
          throw new Error(errorData.error || 'Failed to fetch roles');
        }
        
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
        
        // Fetch effective permissions
        const permissionsResponse = await fetch(`/api/admin/users/${userId}/permissions`);
        
        if (!permissionsResponse.ok) {
          const errorData = await permissionsResponse.json();
          throw new Error(errorData.error || 'Failed to fetch permissions');
        }
        
        const permissionsData = await permissionsResponse.json();
        setEffectivePermissions(permissionsData.effectivePermissions || {});
        setPermissionSources(permissionsData.permissionSources || {});
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

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

  // If user not found
  if (!user) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">User not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The requested user could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EffectivePermissions
      user={user}
      roles={roles}
      effectivePermissions={effectivePermissions}
      permissionSources={permissionSources}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default EffectivePermissionsContainer;
