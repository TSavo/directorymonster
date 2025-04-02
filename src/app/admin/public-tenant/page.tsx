'use client';

import React from 'react';
import { PublicTenantUsers } from '@/components/admin/users/PublicTenantUsers';
import AdminLayout from '@/components/admin/layout/AdminLayout';

/**
 * Admin page for managing users in the public tenant.
 * Shows users currently in the public tenant and allows admins to
 * assign them to specific tenants with appropriate roles.
 */
export default function PublicTenantPage() {
  return (
    <AdminLayout>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Public Tenant Management</h1>
          <p className="text-gray-600">
            Manage users who are currently only in the public tenant. Assign them to specific tenants with appropriate roles.
          </p>
        </div>
        
        <PublicTenantUsers />
      </div>
    </AdminLayout>
  );
}
