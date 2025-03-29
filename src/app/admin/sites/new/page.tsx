import React from 'react';
import Link from 'next/link';

// Try different import methods to increase reliability
let SiteForm;

try {
  const siteComponents = require('@/components/admin/sites');
  SiteForm = siteComponents.SiteForm;
} catch (importError) {
  console.error('Error importing from @/components/admin/sites:', importError.message);
  
  try {
    // Try relative import as fallback
    const relativeSiteComponents = require('../../../../components/admin/sites');
    SiteForm = relativeSiteComponents.SiteForm;
  } catch (fallbackError) {
    console.error('Error with fallback import:', fallbackError.message);
    // Create a minimal fallback component
    SiteForm = () => (
      <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
        <h3 className="font-bold mb-2">Component Error</h3>
        <p>Could not load the SiteForm component. This is likely due to a module resolution error.</p>
        <div className="mt-4">
          <Link href="/admin/sites" className="text-blue-600 hover:underline">
            Return to Sites List
          </Link>
        </div>
      </div>
    );
  }
}

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
