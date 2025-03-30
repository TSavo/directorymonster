'use client';

import React from 'react';
import { WithAuth } from '@/components/admin/auth/WithAuth';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WithAuth loginPath="/login">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </WithAuth>
  );
}
