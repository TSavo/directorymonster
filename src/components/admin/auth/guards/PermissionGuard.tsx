'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import { ResourceType, Permission } from '../utils/accessControl';
import { 
  hasPermissionInTenant, 
  hasAnyPermissionInTenant, 
  hasAllPermissionsInTenant 
} from '../utils/tenantAccessControl';

interface PermissionGuardProps {
  children: ReactNode;
  resourceType: ResourceType;
  permission?: Permission;
  permissions?: Permission[]; // For checking multiple permissions
  resourceId?: string;
  requireAll?: boolean; // If true, require all permissions, otherwise any
  fallback?: ReactNode;
  showLoading?: boolean; // Whether to show loading indicator
  silent?: boolean; // When true, won't show fallback on permission failure
}

/**
 * PermissionGuard restricts UI elements based on specific permissions
 * Only renders children if the user has the required permission(s)
 */
export function PermissionGuard({
  children,
  resourceType,
  permission,
  permissions,
  resourceId,
  requireAll = false,
  fallback = null,
  showLoading = false,
  silent = false,
}: PermissionGuardProps) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function checkPermission() {
      if (!user || !tenant) {
        setHasPermission(false);
        setIsLoading(false);
        return;
      }
      
      try {
        let permitted = false;
        
        if (permissions && permissions.length > 0) {
          // Check multiple permissions
          if (requireAll) {
            // Require all permissions
            permitted = await hasAllPermissionsInTenant(
              user.id,
              tenant.id,
              resourceType,
              permissions,
              resourceId
            );
          } else {
            // Require any permission
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
          // Default to read permission if none specified
          permitted = await hasPermissionInTenant(
            user.id,
            tenant.id,
            resourceType,
            'read',
            resourceId
          );
        }
        
        setHasPermission(permitted);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkPermission();
  }, [user, tenant, resourceType, permission, permissions, resourceId, requireAll]);
  
  // Show loading state if enabled
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
      </div>
    );
  }
  
  // Return children if has permission
  if (hasPermission) {
    return <>{children}</>;
  }
  
  // If loading or no permission and silent mode, render nothing
  if (isLoading || silent) {
    return null;
  }
  
  // Otherwise render fallback
  return <>{fallback}</>;
}

export default PermissionGuard;
