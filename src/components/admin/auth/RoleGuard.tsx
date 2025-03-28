'use client';

import React, { ReactNode } from 'react';
import { useAuth } from './SessionManager';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole: string;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  requiredRole,
  fallback = <AccessDenied />,
}: RoleGuardProps) {
  const { canAccess } = useAuth();
  
  if (!canAccess(requiredRole)) {
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
