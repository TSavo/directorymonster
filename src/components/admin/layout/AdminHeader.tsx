'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, BellIcon, UserIcon } from './icons';
import { TenantSelector } from '@/components/admin/tenant/TenantSelector';
import { SiteSelector } from '@/components/admin/tenant/SiteSelector';
import { useTenantSite } from '@/contexts/TenantSiteContext';
import { UnifiedAuthComponent } from '@/components/auth';
import { AdvancedSearchDialog } from '@/components/ui/advanced-search';
import { Search } from 'lucide-react';

interface AdminHeaderProps {
  toggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ toggleSidebar }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Get tenant and site context
  const { hasMultipleTenants, hasMultipleSites } = useTenantSite();

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  return (
    <header className="sticky top-0 bg-white/95 backdrop-blur-md shadow-sm z-10 transition-all duration-300" data-testid="admin-header">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 focus-visible transition-colors"
                onClick={toggleSidebar}
                aria-label="Open sidebar"
              >
                <MenuIcon className="block h-6 w-6" />
              </button>

              <div className="ml-4 md:ml-0">
                <h1 className="text-xl font-bold text-gradient">Admin Portal</h1>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <AdvancedSearchDialog>
                <div className="relative rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                    placeholder="Search..."
                    readOnly
                  />
                </div>
              </AdvancedSearchDialog>
            </div>

            {/* Tenant and site selectors */}
            {hasMultipleTenants && <TenantSelector className="mr-2" />}
            {hasMultipleSites && <SiteSelector className="mr-2" />}

            {/* Notifications dropdown */}
            <div className="relative">
              <button
                type="button"
                className="p-2 rounded-full text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 focus-visible transition-colors"
                onClick={toggleNotifications}
                aria-expanded={notificationsOpen}
                aria-haspopup="true"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-5 w-5" />
              </button>

              {/* Notification dropdown panel */}
              {notificationsOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-80 rounded-xl shadow-lg py-1 bg-white/95 backdrop-blur-sm border border-neutral-100 focus-visible animate-fade-in"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <div className="px-4 py-3 text-sm text-neutral-900 border-b border-neutral-100">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  <div className="px-4 py-4 text-sm text-neutral-700">
                    <p className="text-center text-neutral-500 flex items-center justify-center">
                      <svg className="h-5 w-5 mr-2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      No new notifications
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Unified Auth Component */}
            <UnifiedAuthComponent />
          </div>
        </div>
      </div>
    </header>
  );
};

// Also export as default for backward compatibility
export default AdminHeader;