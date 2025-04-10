import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RoleUsersContainer } from '@/components/admin/roles/containers/RoleUsersContainer';
import { Metadata } from 'next';

interface RoleUsersPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Role Users | Admin Dashboard',
  description: 'Manage users assigned to this role',
};

export default function RoleUsersPage({ params }: RoleUsersPageProps) {
  return (
    <AdminLayout>
      <RoleUsersContainer roleId={params.id} />
    </AdminLayout>
  );
}
