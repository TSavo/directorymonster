'use client';

import React from 'react';
import { AdminSidebar as NewAdminSidebar } from './sidebar/AdminSidebar';

export interface AdminSidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

/**
 * AdminSidebar Component
 *
 * This component displays the sidebar for the admin dashboard with navigation links.
 * It has been refactored to use a container/presentation pattern with multiple specialized components,
 * each with their own concerns and hooks.
 */
export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, closeSidebar }) => {
  return (
    <NewAdminSidebar
      isOpen={isOpen}
      closeSidebar={closeSidebar}
    />
  );
};

// Also export as default for backward compatibility
export default AdminSidebar;