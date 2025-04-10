"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoleForm } from '../RoleForm';
import { useAuth } from '@/components/admin/auth/AuthProvider';
import { Role, RoleScope, RoleType } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface RoleFormContainerProps {
  roleId?: string;
}

export function RoleFormContainer({ roleId }: RoleFormContainerProps) {
  const router = useRouter();
  const { currentTenant } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteOptions, setSiteOptions] = useState<{ id: string; name: string }[]>([]);
  
  const isEditMode = !!roleId;
  
  // Fetch role data if in edit mode
  useEffect(() => {
    if (isEditMode && roleId) {
      fetchRole(roleId);
    }
    
    // Fetch site options
    fetchSiteOptions();
  }, [isEditMode, roleId]);
  
  // Fetch role data
  const fetchRole = async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/roles/${id}`);
      
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
  
  // Fetch site options
  const fetchSiteOptions = async () => {
    try {
      const response = await fetch('/api/admin/sites?limit=100');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch sites');
      }
      
      const data = await response.json();
      setSiteOptions(data.sites.map((site: any) => ({
        id: site.id,
        name: site.name
      })));
    } catch (err) {
      console.error('Error fetching site options:', err);
      // Don't set error state here, as it's not critical
    }
  };
  
  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      if (isEditMode && roleId) {
        // Update existing role
        const response = await fetch(`/api/admin/roles/${roleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update role');
        }
        
        // Navigate back to roles list
        router.push('/admin/roles');
      } else {
        // Create new role
        const response = await fetch('/api/admin/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create role');
        }
        
        const data = await response.json();
        
        // Navigate to permissions page for the new role
        router.push(`/admin/roles/${data.role.id}/permissions`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save role';
      setError(errorMessage);
    }
  };
  
  // Handle cancel button
  const handleCancel = () => {
    router.push('/admin/roles');
  };
  
  // Loading state
  if (isEditMode && isLoading) {
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
  
  // If in edit mode but role not found
  if (isEditMode && !role) {
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
    <RoleForm
      role={role || undefined}
      tenantId={currentTenant?.id || ''}
      siteOptions={siteOptions}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}

export default RoleFormContainer;
