"use client";

import React, { useState, useEffect } from 'react';
import { UserRoleManager } from '../UserRoleManager';
import { Role } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface UserRoleManagerContainerProps {
  userId: string;
}

export function UserRoleManagerContainer({ userId }: UserRoleManagerContainerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user and roles data
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
        setAvailableRoles(rolesData.availableRoles || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  // Handle adding roles to user
  const handleAddRoles = async (roleIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add roles');
      }
      
      // Refresh roles data
      const rolesResponse = await fetch(`/api/admin/users/${userId}/roles`);
      const rolesData = await rolesResponse.json();
      
      setRoles(rolesData.roles || []);
      setAvailableRoles(rolesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add roles';
      setError(errorMessage);
    }
  };

  // Handle removing a role from user
  const handleRemoveRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove role');
      }
      
      // Refresh roles data
      const rolesResponse = await fetch(`/api/admin/users/${userId}/roles`);
      const rolesData = await rolesResponse.json();
      
      setRoles(rolesData.roles || []);
      setAvailableRoles(rolesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
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
    <UserRoleManager
      user={user}
      roles={roles}
      availableRoles={availableRoles}
      isLoading={isLoading}
      error={error}
      onAddRoles={handleAddRoles}
      onRemoveRole={handleRemoveRole}
    />
  );
}

export default UserRoleManagerContainer;
