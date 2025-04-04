'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Empty state component for the listing table
 */
export function ListingTableEmpty() {
  return (
    <div
      className="text-center p-8 border rounded-lg bg-gray-50"
      data-testid="listings-empty"
    >
      <p
        className="text-gray-500 mb-4"
        data-testid="empty-listings-message"
      >
        No listings found
      </p>

      <Link
        href="/admin/listings/new"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create your first listing
      </Link>
    </div>
  );
}

export default ListingTableEmpty;
