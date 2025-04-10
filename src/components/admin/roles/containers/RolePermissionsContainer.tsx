"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RolePermissions } from '../RolePermissions';
import { Role, Permission } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface RolePermissionsContainerProps {
  roleId: string;
}

export function RolePermissionsContainer({ roleId }: RolePermissionsContainerProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch role data
  useEffect(() => {
    fetchRole();
  }, [roleId]);
  
  const fetchRole = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch role');
      }
      
      const data = await response.json();
      setRole(data.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch role';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle save permissions
  const handleSavePermissions = async (permissions: Permission[]) => {
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update permissions');
      }
      
      // Navigate back to roles list
      router.push('/admin/roles');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save permissions';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/admin/roles');
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
            <div className="mt-4">
              <button
                type="button"
                className="rounded-md bg-red-50 px-2 py-1.5 text-sm font-medium text-red-800 hover:bg-red-100"
                onClick={handleCancel}
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
                onClick={handleCancel}
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
    <RolePermissions
      role={role}
      onSave={handleSavePermissions}
      onCancel={handleCancel}
    />
  );
}

export default RolePermissionsContainer;
