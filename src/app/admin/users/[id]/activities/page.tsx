import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserActivityLogContainer } from '@/components/admin/users/containers';
import { Metadata } from 'next';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';

interface UserActivitiesPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Activity Log | Admin Dashboard',
  description: 'View user activity history',
};

export default function UserActivitiesPage({ params }: UserActivitiesPageProps) {
  return (
    <AdminLayout>
      <UserDetailTabs userId={params.id} activeTab="activities" />
      <div className="mt-6">
        <UserActivityLogContainer userId={params.id} />
      </div>
    </AdminLayout>
  );
}
