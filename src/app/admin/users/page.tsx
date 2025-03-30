'use client';

import React from 'react';
import { UserTable } from '@/components/admin/users';
import { ACLGuard } from '@/components/admin/auth/ACLGuard';
import { WithAuth } from '@/components/admin/auth/WithAuth';

export default function UsersPage() {
  return (
    <WithAuth>
      <div className="container mx-auto px-4 py-8">
        <ACLGuard 
          resourceType="user" 
          permission="read"
          fallback={
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to manage users.
              </p>
            </div>
          }
        >
          <UserTable />
        </ACLGuard>
      </div>
    </WithAuth>
  );
}
