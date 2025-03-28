'use client';

import Link from 'next/link';
import { CategoryTableEmptyStateProps } from '../types';

/**
 * Empty state display when no categories are found
 */
export default function CategoryTableEmptyState({ siteSlug }: CategoryTableEmptyStateProps) {
  const createUrl = siteSlug ? `/admin/sites/${siteSlug}/categories/new` : "/admin/categories/new";
  
  return (
    <div className="text-center p-8 border rounded-lg bg-gray-50" data-testid="empty-state-container">
      <p className="text-gray-500 mb-4" data-testid="empty-state-message">No categories found.</p>
      <Link 
        href={createUrl}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        data-testid="create-category-button"
      >
        Create your first category
      </Link>
    </div>
  );
}
