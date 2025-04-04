'use client';

import React from 'react';

/**
 * Loading state component for the listing table
 */
export function ListingTableLoading() {
  return (
    <div 
      className="w-full p-8 text-center" 
      data-testid="listings-loading"
    >
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading listings...</p>
    </div>
  );
}

export default ListingTableLoading;
