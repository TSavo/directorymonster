import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RoleFormContainer } from '@/components/admin/roles/containers/RoleFormContainer';
import { Metadata } from 'next';

interface EditRolePageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Edit Role | Admin Dashboard',
  description: 'Edit role details',
};

export default function EditRolePage({ params }: EditRolePageProps) {
  return (
    <AdminLayout>
      <RoleFormContainer roleId={params.id} />
    </AdminLayout>
  );
}
