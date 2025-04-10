import React from 'react';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { PermissionComparisonContainer } from '@/components/admin/permissions/containers';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Permission Comparison | Admin Dashboard',
  description: 'Compare permissions between roles or users',
};

export default function PermissionComparisonPage() {
  return (
    <AdminLayout>
      <PermissionComparisonContainer />
    </AdminLayout>
  );
}
