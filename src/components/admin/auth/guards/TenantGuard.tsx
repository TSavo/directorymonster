'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '@/lib/tenant/use-tenant';
import TenantMembershipService from '@/lib/tenant-membership-service';
import AccessDenied from '../../common/AccessDenied';

interface TenantGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * TenantGuard restricts UI access based on tenant membership
 * Only allows access if the user is a member of the current tenant
 */
export function TenantGuard({
  children,
  fallback = <AccessDenied />,
}: TenantGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [hasTenantAccess, setHasTenantAccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    async function checkAccess() {
      if (isAuthenticated && user && tenant) {
        try {
          const isMember = await TenantMembershipService.isTenantMember(
            user.id, 
            tenant.id
          );
          setHasTenantAccess(isMember);
        } catch (error) {
          console.error('Error checking tenant access:', error);
          setHasTenantAccess(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHasTenantAccess(false);
        setIsLoading(false);
      }
    }
    
    checkAccess();
  }, [isAuthenticated, user, tenant]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Show fallback if no access
  if (!isAuthenticated || !user || !tenant || !hasTenantAccess) {
    return <>{fallback}</>;
  }
  
  // User has access, show children
  return <>{children}</>;
}

export default TenantGuard;
