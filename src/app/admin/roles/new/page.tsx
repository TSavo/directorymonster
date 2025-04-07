import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { RoleFormContainer } from '@/components/admin/roles/containers/RoleFormContainer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Role | Admin Dashboard',
  description: 'Create a new role',
};

export default function CreateRolePage() {
  return (
    <AdminLayout>
      <RoleFormContainer />
    </AdminLayout>
  );
}
