import React from 'react';
import { RoleDashboard } from '@/components/admin/roles';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Role Management | Admin Dashboard',
  description: 'Manage roles and permissions',
};

export default function RolesPage() {
  return (
    <AdminLayout>
      <RoleDashboard />
    </AdminLayout>
  );
}
