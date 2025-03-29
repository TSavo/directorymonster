import React from 'react';
import { SiteForm } from '@/components/admin/sites';
import Link from 'next/link';

export default function NewSitePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Site</h1>
        <Link
          href="/admin/sites"
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 border border-gray-200">
        <SiteForm />
      </div>
    </div>
  );
}
