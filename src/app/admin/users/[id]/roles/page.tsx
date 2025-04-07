import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserRoleManagerContainer } from '@/components/admin/users/containers';
import { Metadata } from 'next';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';

interface UserRolesPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Roles | Admin Dashboard',
  description: 'Manage user roles',
};

export default function UserRolesPage({ params }: UserRolesPageProps) {
  return (
    <AdminLayout>
      <UserDetailTabs userId={params.id} activeTab="roles" />
      <div className="mt-6">
        <UserRoleManagerContainer userId={params.id} />
      </div>
    </AdminLayout>
  );
}
