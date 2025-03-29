'use client';

import React, { ReactNode, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Breadcrumbs } from './Breadcrumbs';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for larger screens and overlay for mobile when open */}
      <AdminSidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with toggle button */}
        <AdminHeader toggleSidebar={toggleSidebar} />
        
        {/* Main content with breadcrumbs */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Breadcrumbs pathname={pathname} />
          <div className="mt-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;