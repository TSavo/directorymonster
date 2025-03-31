'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import { ResourceType, Permission } from '../utils/accessControl';
import { 
  hasPermissionInTenant, 
  hasAnyPermissionInTenant, 
  hasAllPermissionsInTenant,
  hasGlobalPermissionInTenant,
  getAccessibleResourcesInTenant
} from '../utils/tenantAccessControl';

interface UsePermissionOptions {
  resourceType: ResourceType;
  permission?: Permission;
  permissions?: Permission[];
  resourceId?: string;
  requireAll?: boolean;
}

interface UsePermissionResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
  checkResourcePermission: (resourceId: string) => Promise<boolean>;
  getAccessibleResources: () => Promise<string[]>;
  hasGlobalPermission: () => Promise<boolean>;
}

/**
 * Hook for checking permissions programmatically in components
 * Provides current permission state and utility functions
 */
export function usePermission({
  resourceType,
  permission,
  permissions,
  resourceId,
  requireAll = false,
}: UsePermissionOptions): UsePermissionResult {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Check permission on component mount and when dependencies change
  useEffect(() => {
    async function checkPermission() {
      if (!user || !tenant) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setError(null);
        let permitted = false;
        
        if (permissions && permissions.length > 0) {
          // Check multiple permissions
          if (requireAll) {
            permitted = await hasAllPermissionsInTenant(
              user.id,
              tenant.id,
              resourceType,
              permissions,
              resourceId
            );
          } else {
            permitted = await hasAnyPermissionInTenant(
              user.id,
              tenant.id,
              resourceType,
              permissions,
              resourceId
            );
          }
        } else if (permission) {
          // Check single permission
          permitted = await hasPermissionInTenant(
            user.id,
            tenant.id,
            resourceType,
            permission,
            resourceId
          );
        } else {
          // Default to read permission
          permitted = await hasPermissionInTenant(
            user.id,
            tenant.id,
            resourceType,
            'read',
            resourceId
          );
        }
        
        setHasPermission(permitted);
      } catch (err) {
        console.error('Error checking permission:', err);
        setError(err instanceof Error ? err : new Error('Unknown error checking permission'));
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkPermission();
  }, [user, tenant, resourceType, permission, permissions, resourceId, requireAll]);

  // Function to check permission for a specific resource ID
  const checkResourcePermission = async (resourceId: string): Promise<boolean> => {
    if (!user || !tenant) return false;
    
    try {
      if (permissions && permissions.length > 0) {
        return requireAll
          ? await hasAllPermissionsInTenant(user.id, tenant.id, resourceType, permissions, resourceId)
          : await hasAnyPermissionInTenant(user.id, tenant.id, resourceType, permissions, resourceId);
      } else {
        const permToCheck = permission || 'read';
        return await hasPermissionInTenant(user.id, tenant.id, resourceType, permToCheck, resourceId);
      }
    } catch (err) {
      console.error('Error checking resource permission:', err);
      return false;
    }
  };

  // Function to get all accessible resources of this type
  const getAccessibleResources = async (): Promise<string[]> => {
    if (!user || !tenant) return [];
    
    try {
      const permToCheck = permission || 'read';
      return await getAccessibleResourcesInTenant(user.id, tenant.id, resourceType, permToCheck);
    } catch (err) {
      console.error('Error getting accessible resources:', err);
      return [];
    }
  };

  // Function to check global permission (for all resources of this type)
  const hasGlobalPermission = async (): Promise<boolean> => {
    if (!user || !tenant) return false;
    
    try {
      const permToCheck = permission || 'read';
      return await hasGlobalPermissionInTenant(user.id, tenant.id, resourceType, permToCheck);
    } catch (err) {
      console.error('Error checking global permission:', err);
      return false;
    }
  };

  return {
    hasPermission,
    isLoading,
    error,
    checkResourcePermission,
    getAccessibleResources,
    hasGlobalPermission,
  };
}

export default usePermission;
