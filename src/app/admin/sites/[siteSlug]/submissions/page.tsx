import React from 'react';
import { SubmissionDashboard } from '@/components/admin/submissions/SubmissionDashboard';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { Metadata } from 'next';

interface SiteSubmissionsPageProps {
  params: {
    siteSlug: string;
  };
}

export const metadata: Metadata = {
  title: 'Site Submissions | Admin Dashboard',
  description: 'Review and manage submissions for this site',
};

export default function SiteSubmissionsPage({ params }: SiteSubmissionsPageProps) {
  return (
    <AdminLayout>
      <SubmissionDashboard siteSlug={params.siteSlug} />
    </AdminLayout>
  );
}
