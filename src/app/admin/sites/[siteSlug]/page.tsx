import React from 'react';
import Link from 'next/link';

export default function SiteDashboardPage({ params }: { params: { siteSlug: string } }) {
  const { siteSlug } = params;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Site Dashboard: {siteSlug}</h1>
      
      <div className="mb-4">
        <Link
          href="/admin/sites"
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sites
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <p className="text-gray-600 mb-4">Manage categories for this site.</p>
          <Link 
            href={`/admin/sites/${siteSlug}/categories`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Categories
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Listings</h2>
          <p className="text-gray-600 mb-4">Manage listings for this site.</p>
          <Link 
            href={`/admin/sites/${siteSlug}/listings`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Manage Listings
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <p className="text-gray-600 mb-4">Configure site settings and appearance.</p>
          <Link 
            href={`/admin/sites/${siteSlug}/settings`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Site Settings
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          <p className="text-gray-600 mb-4">View site traffic and engagement metrics.</p>
          <Link 
            href={`/admin/sites/${siteSlug}/analytics`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
