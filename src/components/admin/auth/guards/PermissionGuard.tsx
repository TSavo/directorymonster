'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '../utils/accessControl';

interface PermissionGuardProps {
  children: ReactNode;
  resourceType: ResourceType;
  permission: Permission;
  resourceId?: string;
  fallback?: ReactNode;
}

/**
 * PermissionGuard restricts UI elements based on specific permissions
 * Only renders children if the user has the required permission in the current tenant
 */
export function PermissionGuard({
  children,
  resourceType,
  permission,
  resourceId,
  fallback = null,
}: PermissionGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function checkPermission() {
      if (isAuthenticated && user && tenant) {
        try {
          const permitted = await RoleService.hasPermission(
            user.id,
            tenant.id,
            resourceType,
            permission,
            resourceId
          );
          setHasPermission(permitted);
        } catch (error) {
          console.error('Error checking permission:', error);
          setHasPermission(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasPermission(false);
        setIsLoading(false);
      }
    }
    
    checkPermission();
  }, [isAuthenticated, user, tenant, resourceType, permission, resourceId]);
  
  // Skip rendering while loading (minimizes UI flicker)
  if (isLoading) {
    return null;
  }
  
  // Render children only if user has permission
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

export default PermissionGuard;
