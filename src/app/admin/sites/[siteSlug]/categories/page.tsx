import React from 'react';
import Link from 'next/link';

// Try different import methods to increase reliability
let CategoryTable;

try {
  const categoryComponents = require('@/components/admin/categories');
  CategoryTable = categoryComponents.CategoryTable;
} catch (importError) {
  console.error('Error importing from @/components/admin/categories:', importError.message);
  
  try {
    // Try relative import as fallback
    const relativeCategoryComponents = require('../../../../../components/admin/categories');
    CategoryTable = relativeCategoryComponents.CategoryTable;
  } catch (fallbackError) {
    console.error('Error with fallback import:', fallbackError.message);
    // Create a minimal fallback component
    CategoryTable = () => (
      <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
        <h3 className="font-bold mb-2">Component Error</h3>
        <p>Could not load the CategoryTable component. This is likely due to a module resolution error.</p>
        <div className="mt-4">
          <Link href="/admin/sites" className="text-blue-600 hover:underline">
            Return to Sites List
          </Link>
        </div>
      </div>
    );
  }
}

export default function CategoriesPage({ params }: { params: { siteSlug: string } }) {
  const { siteSlug } = params;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <Link
          href={`/admin/sites/${siteSlug}/categories/new`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>
      
      <div className="mb-4">
        <Link
          href={`/admin/sites/${siteSlug}`}
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Site Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
        <CategoryTable siteSlug={siteSlug} />
      </div>
    </div>
  );
}
