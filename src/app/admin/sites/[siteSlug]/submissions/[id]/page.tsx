import React from 'react';
import { SubmissionDetail } from '@/components/admin/submissions/SubmissionDetail';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';

interface SiteSubmissionDetailPageProps {
  params: {
    siteSlug: string;
    id: string;
  };
}

export const metadata: Metadata = {
  title: 'Submission Details | Admin Dashboard',
  description: 'Review submission details for this site',
};

export default function SiteSubmissionDetailPage({ params }: SiteSubmissionDetailPageProps) {
  return (
    <AdminLayout>
      <SubmissionDetail 
        submissionId={params.id} 
        siteSlug={params.siteSlug} 
      />
    </AdminLayout>
  );
}
