'use client';

import React from 'react';
import { SecurityDashboard } from '@/components/admin/security/SecurityDashboard';

export default function SecurityDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6" data-testid="security-dashboard">
      <h1 className="text-2xl font-bold mb-6" data-testid="security-dashboard-heading">Security Dashboard</h1>
      
      <SecurityDashboard />
    </div>
  );
}
