import React from 'react';
import { SubmissionDetail } from '@/components/admin/submissions/SubmissionDetail';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';

interface SubmissionDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Submission Details | Admin Dashboard',
  description: 'Review submission details',
};

export default function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  return (
    <AdminLayout>
      <SubmissionDetail submissionId={params.id} />
    </AdminLayout>
  );
}
