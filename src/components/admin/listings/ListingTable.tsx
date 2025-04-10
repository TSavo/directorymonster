'use client';

import React from 'react';
import { ListingTable as NewListingTable } from './table/ListingTable';
import { ListingTableProps } from './types';

/**
 * ListingTable Component
 *
 * This component displays a table of listings with actions to view, edit, and delete listings.
 * It has been refactored to use a container/presentation pattern with multiple specialized components,
 * each with their own concerns and hooks.
 *
 * Features:
 * - Sorting (click column headers)
 * - Filtering (by category, search term)
 * - Pagination
 * - CRUD operations (view, edit, delete)
 * - Responsive design (mobile view for smaller screens)
 * - Loading states with skeletons
 * - Error handling with retry options
 * - ARIA accessibility
 */
export function ListingTable({ siteSlug, initialListings }: ListingTableProps) {
  return (
    <NewListingTable
      siteSlug={siteSlug}
      initialListings={initialListings}
    />
  );
}

// Enable both named and default exports
export default ListingTable;
