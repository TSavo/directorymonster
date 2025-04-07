import React from 'react';
import { SubmissionDashboard } from '@/components/admin/submissions/SubmissionDashboard';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submissions | Admin Dashboard',
  description: 'Review and manage user submissions',
};

export default function SubmissionsPage() {
  return (
    <AdminLayout>
      <SubmissionDashboard />
    </AdminLayout>
  );
}
