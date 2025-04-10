'use client';

import { useTenantSite } from '@/hooks/useTenantSite';

export interface UseAdminHeaderProps {
  toggleSidebar: () => void;
}

export interface UseAdminHeaderReturn {
  // Tenant/Site data
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;

  // Handlers
  toggleSidebar: () => void;
}

/**
 * Hook for AdminHeader component
 *
 * Handles state and logic for the admin header.
 * This hook is now much simpler because we've moved most of the logic
 * to dedicated component hooks (NotificationsDropdown, MobileMenuButton, etc.)
 */
export function useAdminHeader({ toggleSidebar }: UseAdminHeaderProps): UseAdminHeaderReturn {
  // Get tenant/site context
  const { hasMultipleTenants, hasMultipleSites } = useTenantSite();

  return {
    // Tenant/Site data
    hasMultipleTenants,
    hasMultipleSites,

    // Handlers
    toggleSidebar
  };
}
