'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ListIcon,
  FolderIcon,
  GlobeIcon,
  UsersIcon,
  SettingsIcon,
  ChartIcon,
  CloseIcon,
  ShieldIcon,
  InboxIcon
} from './icons';

interface AdminSidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.FC<{ className?: string }>;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Listings', href: '/admin/listings', icon: ListIcon },
  { name: 'Submissions', href: '/admin/submissions', icon: InboxIcon },
  { name: 'Categories', href: '/admin/categories', icon: FolderIcon },
  { name: 'Sites', href: '/admin/sites', icon: GlobeIcon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartIcon },
  { name: 'Security', href: '/admin/security', icon: ShieldIcon },
  { name: 'Permissions', href: '/admin/permissions/compare', icon: ShieldIcon },
  { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, closeSidebar }) => {
  const pathname = usePathname();

  // Mobile sidebar backdrop
  const backdropClasses = isOpen
    ? 'fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-20 transition-opacity ease-linear duration-300'
    : 'hidden';

  // Sidebar positioning
  const sidebarClasses = isOpen
    ? 'fixed inset-y-0 left-0 flex flex-col w-64 bg-sidebar z-30 transform transition-all ease-in-out duration-300 shadow-xl'
    : 'fixed inset-y-0 left-0 flex flex-col w-64 bg-sidebar z-30 transform -translate-x-full md:translate-x-0 transition-all ease-in-out duration-300 shadow-xl';

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={backdropClasses}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className={sidebarClasses} data-testid="admin-sidebar">
        <div className="flex items-center justify-between h-20 flex-shrink-0 px-6 border-b border-sidebar-muted/30">
          <Link href="/admin" className="font-bold text-xl text-sidebar text-gradient hover:opacity-90 transition-opacity">
            DirectoryMonster
          </Link>
          <button
            className="md:hidden text-sidebar-muted hover:text-sidebar focus-visible transition-colors rounded-full p-1 hover:bg-white/5"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto py-4">
          <nav className="flex-1 px-3 space-y-1.5" data-testid="admin-navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 hover:-translate-y-0.5
                    ${isActive ? 'bg-white/10 text-sidebar shadow-md' : 'text-sidebar-muted hover:text-sidebar hover:bg-white/5'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={isOpen ? closeSidebar : undefined}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5
                      ${isActive ? 'text-sidebar' : 'text-sidebar-muted group-hover:text-sidebar'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 flex p-4 border-t border-sidebar-muted/30">
          <Link
            href="/"
            className="text-sm flex items-center text-sidebar-muted hover:text-sidebar transition-colors focus-visible"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Site
          </Link>
        </div>
      </div>
    </>
  );
};

// Also export as default for backward compatibility
export default AdminSidebar;