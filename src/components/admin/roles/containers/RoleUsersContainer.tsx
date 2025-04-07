"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleUsers } from '../RoleUsers';
import { Role } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface RoleUsersContainerProps {
  roleId: string;
}

export function RoleUsersContainer({ roleId }: RoleUsersContainerProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch role and users data
  useEffect(() => {
    fetchRoleAndUsers();
  }, [roleId]);
  
  const fetchRoleAndUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch role details
      const roleResponse = await fetch(`/api/admin/roles/${roleId}`);
      
      if (!roleResponse.ok) {
        const errorData = await roleResponse.json();
        throw new Error(errorData.error || 'Failed to fetch role');
      }
      
      const roleData = await roleResponse.json();
      setRole(roleData.role);
      
      // Fetch users assigned to this role
      const usersResponse = await fetch(`/api/admin/roles/${roleId}/users`);
      
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);
      setAvailableUsers(usersData.availableUsers || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding users to role
  const handleAddUsers = async (userIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add users');
      }
      
      // Refresh the user list
      fetchRoleAndUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add users';
      setError(errorMessage);
    }
  };
  
  // Handle removing a user from the role
  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/users?userId=${userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }
      
      // Refresh the user list
      fetchRoleAndUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user';
      setError(errorMessage);
    }
  };
  
  // Handle back button
  const handleBack = () => {
    router.push('/admin/roles');
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="role-users-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="role-users-error">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                onClick={handleBack}
              >
                Back to Roles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If role not found
  if (!role) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Role not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The requested role could not be found.</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                onClick={handleBack}
              >
                Back to Roles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <RoleUsers
      role={role}
      users={users}
      availableUsers={availableUsers}
      isLoading={isLoading}
      error={error}
      onAddUsers={handleAddUsers}
      onRemoveUser={handleRemoveUser}
      onBack={handleBack}
    />
  );
}

export default RoleUsersContainer;
