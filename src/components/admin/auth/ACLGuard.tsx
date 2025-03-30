'use client';

import React, { ReactNode } from 'react';
import { useAuth } from './hooks/useAuth';
import { ResourceType, Permission } from './utils/accessControl';

interface ACLGuardProps {
  children: ReactNode;
  resourceType: ResourceType;
  permission: Permission;
  resourceId?: string;
  siteId?: string;
  fallback?: ReactNode;
}

/**
 * Component that only renders children if the user has the required permission
 */
export function ACLGuard({
  children,
  resourceType,
  permission,
  resourceId,
  siteId,
  fallback = <AccessDenied />,
}: ACLGuardProps) {
  const { user, isAuthenticated, hasPermission } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }
  
  if (!hasPermission(resourceType, permission, resourceId, siteId)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        You don't have the required permissions to access this resource.
      </p>
    </div>
  );
}

export default ACLGuard;
