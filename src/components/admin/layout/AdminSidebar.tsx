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
    ? 'fixed inset-0 bg-gray-600 bg-opacity-75 z-20 transition-opacity ease-linear duration-300'
    : 'hidden';

  // Sidebar positioning
  const sidebarClasses = isOpen
    ? 'fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-800 z-30 transform transition ease-in-out duration-300'
    : 'fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-800 z-30 transform -translate-x-full md:translate-x-0 transition ease-in-out duration-300';

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
        <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-gray-900">
          <Link href="/admin" className="text-white font-bold text-xl">
            DirectoryMonster
          </Link>
          <button
            className="md:hidden text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1" data-testid="admin-navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={isOpen ? closeSidebar : undefined}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-6 w-6
                      ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}
                    `}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
          <Link
            href="/"
            className="text-gray-300 hover:text-white text-sm"
          >
            ← Return to Site
          </Link>
        </div>
      </div>
    </>
  );
};

// Also export as default for backward compatibility
export default AdminSidebar;