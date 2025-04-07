import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RolePermissionsContainer } from '@/components/admin/roles/containers/RolePermissionsContainer';
import { Metadata } from 'next';

interface RolePermissionsPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Role Permissions | Admin Dashboard',
  description: 'Manage role permissions',
};

export default function RolePermissionsPage({ params }: RolePermissionsPageProps) {
  return (
    <AdminLayout>
      <RolePermissionsContainer roleId={params.id} />
    </AdminLayout>
  );
}
