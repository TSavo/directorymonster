"use client";

import { ReactNode } from 'react';
import { AdminLayout } from '@/components/admin/layout';
// Import WithAuth directly from auth module
import { WithAuth } from '@/components/admin/auth';

interface AdminRootLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminRootLayoutProps) {
  return (
    <WithAuth>
      <AdminLayout>
        {children}
      </AdminLayout>
    </WithAuth>
  );
}