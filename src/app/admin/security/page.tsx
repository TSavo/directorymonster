'use client';

import React from 'react';
import { SecurityDashboard } from '@/components/admin/security';
import { AdminLayout } from '@/components/admin/layout';

export default function SecurityDashboardPage() {
  return (
    <AdminLayout
      title="Security Dashboard"
      description="Monitor and manage security for your application"
    >
      <SecurityDashboard />
    </AdminLayout>
  );
}
