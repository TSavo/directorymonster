'use client';

import { useState, useEffect, useCallback } from 'react';
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
import TenantMembershipService from '@/lib/tenant-membership-service';

/**
 * Hook for checking user permissions in the current tenant context
 */
export function useTenantPermission() {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is a member of the current tenant
  useEffect(() => {
    async function checkMembership() {
      if (isAuthenticated && user && tenant) {
        try {
          const membershipStatus = await TenantMembershipService.isTenantMember(
            user.id,
            tenant.id
          );
          setIsMember(membershipStatus);
        } catch (error) {
          console.error('Error checking tenant membership:', error);
          setIsMember(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsMember(false);
        setIsLoading(false);
      }
    }

    checkMembership();
  }, [isAuthenticated, user, tenant]);

  /**
   * Check if user has a specific permission for a resource
   */
  const checkPermission = useCallback(
    async (
      resourceType: ResourceType,
      permission: Permission,
      resourceId?: string
    ): Promise<boolean> => {
      if (!isAuthenticated || !user || !tenant || !isMember) {
        return false;
      }

      try {
        return await hasPermissionInTenant(
          user.id,
          tenant.id,
          resourceType,
          permission,
          resourceId
        );
      } catch (error) {
        console.error('Error checking permission:', error);
        return false;
      }
    },
    [isAuthenticated, user, tenant, isMember]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const checkAnyPermission = useCallback(
    async (
      resourceType: ResourceType,
      permissions: Permission[],
      resourceId?: string
    ): Promise<boolean> => {
      if (!isAuthenticated || !user || !tenant || !isMember) {
        return false;
      }

      try {
        return await hasAnyPermissionInTenant(
          user.id,
          tenant.id,
          resourceType,
          permissions,
          resourceId
        );
      } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
      }
    },
    [isAuthenticated, user, tenant, isMember]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const checkAllPermissions = useCallback(
    async (
      resourceType: ResourceType,
      permissions: Permission[],
      resourceId?: string
    ): Promise<boolean> => {
      if (!isAuthenticated || !user || !tenant || !isMember) {
        return false;
      }

      try {
        return await hasAllPermissionsInTenant(
          user.id,
          tenant.id,
          resourceType,
          permissions,
          resourceId
        );
      } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
      }
    },
    [isAuthenticated, user, tenant, isMember]
  );

  /**
   * Check if user has global permission for a resource type
   */
  const checkGlobalPermission = useCallback(
    async (
      resourceType: ResourceType,
      permission: Permission
    ): Promise<boolean> => {
      if (!isAuthenticated || !user || !tenant || !isMember) {
        return false;
      }

      try {
        return await hasGlobalPermissionInTenant(
          user.id,
          tenant.id,
          resourceType,
          permission
        );
      } catch (error) {
        console.error('Error checking global permission:', error);
        return false;
      }
    },
    [isAuthenticated, user, tenant, isMember]
  );

  /**
   * Get all resources of a type that user has permission for
   */
  const getAccessibleResources = useCallback(
    async (
      resourceType: ResourceType,
      permission: Permission
    ): Promise<string[]> => {
      if (!isAuthenticated || !user || !tenant || !isMember) {
        return [];
      }

      try {
        return await getAccessibleResourcesInTenant(
          user.id,
          tenant.id,
          resourceType,
          permission
        );
      } catch (error) {
        console.error('Error getting accessible resources:', error);
        return [];
      }
    },
    [isAuthenticated, user, tenant, isMember]
  );

  return {
    isLoading,
    isMember,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkGlobalPermission,
    getAccessibleResources,
  };
}

export default useTenantPermission;