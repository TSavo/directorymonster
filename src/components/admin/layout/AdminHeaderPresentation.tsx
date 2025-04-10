'use client';

import React from 'react';
import { MobileMenuButton } from './mobile-menu/MobileMenuButton';
import { AdminHeaderLogo } from './logo/AdminHeaderLogo';
import { SearchBar } from '../search/SearchBar';
import { TenantSelector } from '../tenant/TenantSelector';
import { SiteSelector } from '../tenant/SiteSelector';
import { NotificationsDropdown } from '../notifications/NotificationsDropdown';
import { UnifiedAuthComponent } from '@/components/auth';

export interface AdminHeaderPresentationProps {
  // Tenant/Site data
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;

  // Handlers
  toggleSidebar: () => void;
}

/**
 * AdminHeaderPresentation Component
 *
 * Pure UI component for rendering the admin header.
 * This component composes multiple smaller components, each with their own concerns.
 */
export function AdminHeaderPresentation({
  hasMultipleTenants,
  hasMultipleSites,
  toggleSidebar
}: AdminHeaderPresentationProps) {
  return (
    <header className="sticky top-0 bg-header/95 backdrop-blur-md shadow-sm z-10 transition-all duration-300" data-testid="admin-header">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Mobile menu button - has its own hook and logic */}
              <MobileMenuButton toggleSidebar={toggleSidebar} />

              {/* Admin header logo - simple presentational component */}
              <AdminHeaderLogo />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search bar - has its own hook and logic */}
            <SearchBar />

            {/* Tenant selector - has its own hook and logic */}
            {hasMultipleTenants && <TenantSelector className="mr-2" />}

            {/* Site selector - has its own hook and logic */}
            {hasMultipleSites && <SiteSelector className="mr-2" />}

            {/* Notifications dropdown - has its own hook and logic */}
            <NotificationsDropdown />

            {/* Unified auth component - has its own hook and logic */}
            <UnifiedAuthComponent />
          </div>
        </div>
      </div>
    </header>
  );
}
