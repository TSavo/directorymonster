'use client';

import React, { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { ContextBreadcrumbs } from '@/components/ui/context-breadcrumbs';
import { QuickActionsMenu } from '@/components/ui/quick-actions';

export interface AdminLayoutPresentationProps {
  children: ReactNode;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export function AdminLayoutPresentation({
  children,
  sidebarOpen,
  toggleSidebar,
  closeSidebar
}: AdminLayoutPresentationProps) {
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar for larger screens and overlay for mobile when open */}
      <AdminSidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden" data-testid="admin-content">
        {/* Header with toggle button */}
        <AdminHeader toggleSidebar={toggleSidebar} />

        {/* Main content with breadcrumbs */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6" data-testid="admin-main-content">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <ContextBreadcrumbs />
            <QuickActionsMenu />
          </div>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayoutPresentation;
