import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';
import { UserForm } from '@/components/admin/users';
import { Metadata } from 'next';

interface UserDetailsPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'User Details | Admin Dashboard',
  description: 'View and edit user details',
};

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  return (
    <AdminLayout>
      <UserDetailTabs userId={params.id} activeTab="details" />
      <div className="mt-6">
        {/* Render user form in read-only mode */}
        <UserForm userId={params.id} readOnly={false} />
      </div>
    </AdminLayout>
  );
}
