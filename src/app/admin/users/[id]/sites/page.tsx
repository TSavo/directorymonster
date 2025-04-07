import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserSiteAccessContainer } from '@/components/admin/users/containers';
import { Metadata } from 'next';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';

interface UserSitesPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Site Access | Admin Dashboard',
  description: 'Manage user site access',
};

export default function UserSitesPage({ params }: UserSitesPageProps) {
  return (
    <AdminLayout>
      <UserDetailTabs userId={params.id} activeTab="sites" />
      <div className="mt-6">
        <UserSiteAccessContainer userId={params.id} />
      </div>
    </AdminLayout>
  );
}
