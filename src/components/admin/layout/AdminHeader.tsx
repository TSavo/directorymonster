'use client';

import React from 'react';
import { AdminHeaderContainer } from './AdminHeaderContainer';

export interface AdminHeaderProps {
  toggleSidebar: () => void;
}

/**
 * AdminHeader Component
 *
 * This component displays the header for the admin dashboard with navigation, notifications, and user profile.
 * It has been refactored to use a container/presentation pattern with multiple specialized components,
 * each with their own concerns and hooks.
 */
export const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar }) => {
  return <AdminHeaderContainer toggleSidebar={toggleSidebar} />;
};

// Also export as default for backward compatibility
export default AdminHeader;