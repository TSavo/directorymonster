import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { EffectivePermissionsContainer } from '@/components/admin/permissions/containers';
import { Metadata } from 'next';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';

interface UserPermissionsPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Permissions | Admin Dashboard',
  description: 'View user effective permissions',
};

export default function UserPermissionsPage({ params }: UserPermissionsPageProps) {
  return (
    <AdminLayout>
      <UserDetailTabs userId={params.id} activeTab="permissions" />
      <div className="mt-6">
        <EffectivePermissionsContainer userId={params.id} />
      </div>
    </AdminLayout>
  );
}
