'use client';

import React from 'react';
import { useAdminHeader } from './hooks/useAdminHeader';
import { AdminHeaderPresentation } from './AdminHeaderPresentation';

export interface AdminHeaderContainerProps {
  toggleSidebar: () => void;
}

/**
 * AdminHeaderContainer Component
 *
 * Container component that connects the hook and presentation components
 */
export function AdminHeaderContainer({ toggleSidebar }: AdminHeaderContainerProps) {
  // Use the hook to get data and handlers
  const adminHeaderData = useAdminHeader({ toggleSidebar });

  // Return the presentation component with props from hook
  return <AdminHeaderPresentation {...adminHeaderData} />;
}
