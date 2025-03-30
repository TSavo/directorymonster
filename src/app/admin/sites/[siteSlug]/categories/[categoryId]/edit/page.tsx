import React from 'react';
import Link from 'next/link';

// Try different import methods to increase reliability
let CategoryForm;

try {
  const categoryComponents = require('@/components/admin/categories');
  CategoryForm = categoryComponents.CategoryForm;
} catch (importError) {
  console.error('Error importing from @/components/admin/categories:', importError.message);
  
  try {
    // Try relative import as fallback
    const relativeCategoryComponents = require('../../../../../../../components/admin/categories');
    CategoryForm = relativeCategoryComponents.CategoryForm;
  } catch (fallbackError) {
    console.error('Error with fallback import:', fallbackError.message);
    // Create a minimal fallback component
    CategoryForm = ({ siteSlug }: { siteSlug: string }) => (
      <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
        <h3 className="font-bold mb-2">Component Error</h3>
        <p>Could not load the CategoryForm component. This is likely due to a module resolution error.</p>
        <div className="mt-4">
          <Link href={`/admin/sites/${siteSlug}/categories`} className="text-blue-600 hover:underline">
            Return to Categories List
          </Link>
        </div>
      </div>
    );
  }
}

interface EditCategoryPageProps {
  params: {
    siteSlug: string;
    categoryId: string;
  };
}

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { siteSlug, categoryId } = params;
  
  // Fetch initial category data for editing
  let initialData = null;
  let error = null;
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/sites/${siteSlug}/categories/${categoryId}`, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch category: ${response.statusText}`);
    }
    
    initialData = await response.json();
  } catch (err) {
    console.error('Error fetching category data:', err);
    error = err instanceof Error ? err.message : 'Failed to load category data';
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Category</h1>
        <Link
          href={`/admin/sites/${siteSlug}/categories`}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
      
      <div className="mb-4">
        <Link
          href={`/admin/sites/${siteSlug}/categories`}
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Categories
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 border border-gray-200">
        {error ? (
          <div className="p-4 border border-red-300 bg-red-50 text-red-700 rounded">
            <h3 className="font-bold mb-2">Error Loading Category</h3>
            <p>{error}</p>
            <div className="mt-4">
              <Link href={`/admin/sites/${siteSlug}/categories`} className="text-blue-600 hover:underline">
                Return to Categories List
              </Link>
            </div>
          </div>
        ) : (
          <CategoryForm 
            siteSlug={siteSlug} 
            categoryId={categoryId} 
            initialData={initialData}
          />
        )}
      </div>
    </div>
  );
}
