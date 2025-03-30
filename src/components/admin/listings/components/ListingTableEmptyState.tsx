'use client';

import Link from 'next/link';
import { ListingTableEmptyStateProps } from '../types';

/**
 * Empty state display when no listings are found
 */
export function ListingTableEmptyState({ siteSlug }: ListingTableEmptyStateProps) {
  const createUrl = siteSlug ? `/admin/${siteSlug}/listings/new` : "/admin/listings/new";
  
  return (
    <div className="text-center p-8 border rounded-lg bg-gray-50">
      <p className="text-gray-500 mb-4">No listings found.</p>
      <Link 
        href={createUrl}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create your first listing
      </Link>
    </div>
  );
}

// Enable both named and default exports
export default ListingTableEmptyState;
