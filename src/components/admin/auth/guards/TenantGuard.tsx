'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { ResourceType, Permission } from '../utils/accessControl';
import { hasPermissionInTenant, hasAnyPermissionInTenant, hasAllPermissionsInTenant } from '../utils/tenantAccessControl';
import AccessDenied from '../../common/AccessDenied';

interface TenantGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  // Optional permission checks
  resourceType?: ResourceType;
  permission?: Permission;
  permissions?: Permission[]; // For checking multiple permissions
  resourceId?: string;
  requireAll?: boolean; // If true, require all permissions, otherwise any
  showLoading?: boolean; // Whether to show loading indicator
}

/**
 * TenantGuard restricts UI access based on tenant membership and optional permissions
 * Only allows access if the user is a member of the current tenant and has required permissions
 */
export function TenantGuard({
  children,
  fallback = <AccessDenied />,
  resourceType,
  permission,
  permissions,
  resourceId,
  requireAll = false,
  showLoading = true,
}: TenantGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkAccess() {
      if (isAuthenticated && user && tenant) {
        try {
          // First check tenant membership
          const isMember = await TenantMembershipService.isTenantMember(
            user.id,
            tenant.id
          );

          if (!isMember) {
            setHasAccess(false);
            setIsLoading(false);
            return;
          }

          // If no permission checks required, grant access based on membership
          if (!resourceType) {
            setHasAccess(true);
            setIsLoading(false);
            return;
          }

          // Check permissions if resourceType is specified
          let hasPermission = false;

          if (permissions && permissions.length > 0) {
            // Check multiple permissions
            if (requireAll) {
              // Require all permissions
              hasPermission = await hasAllPermissionsInTenant(
                user.id,
                tenant.id,
                resourceType,
                permissions,
                resourceId
              );
            } else {
              // Require any permission
              hasPermission = await hasAnyPermissionInTenant(
                user.id,
                tenant.id,
                resourceType,
                permissions,
                resourceId
              );
            }
          } else if (permission) {
            // Check single permission
            hasPermission = await hasPermissionInTenant(
              user.id,
              tenant.id,
              resourceType,
              permission,
              resourceId
            );
          } else {
            // Default to read permission if none specified
            hasPermission = await hasPermissionInTenant(
              user.id,
              tenant.id,
              resourceType,
              'read',
              resourceId
            );
          }

          setHasAccess(hasPermission);
        } catch (error) {
          console.error('Error checking tenant access:', error);
          setHasAccess(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasAccess(false);
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [isAuthenticated, user, tenant, resourceType, permission, permissions, resourceId, requireAll]);

  // Show loading state if enabled
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Show fallback if no access
  if (isLoading || !hasAccess) {
    return <>{fallback}</>;
  }

  // User has access, show children
  return <>{children}</>;
}

export default TenantGuard;