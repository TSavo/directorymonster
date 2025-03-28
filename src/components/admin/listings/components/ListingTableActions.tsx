'use client';

import Link from 'next/link';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ListingTableActionsProps } from '../types';
import { getListingEditUrl } from '../utils';

/**
 * Action buttons for CRUD operations on a listing
 */
export function ListingTableActions({ 
  listingId, 
  listingSlug, 
  listingTitle, 
  siteSlug, 
  onDeleteClick 
}: ListingTableActionsProps) {
  const editUrl = getListingEditUrl(siteSlug, listingId, listingSlug);
  const viewUrl = siteSlug 
    ? `/admin/${siteSlug}/listings/${listingSlug}` 
    : `/admin/listings/${listingId}`;
  
  return (
    <td className="px-6 py-4 text-sm font-medium text-right space-x-2 whitespace-nowrap">
      <Link
        href={viewUrl}
        className="text-blue-600 hover:text-blue-900 inline-flex items-center"
        aria-label={`View ${listingTitle}`}
      >
        <Eye size={16} className="mr-1" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">View</span>
      </Link>
      
      <Link
        href={editUrl}
        className="text-amber-600 hover:text-amber-900 inline-flex items-center"
        aria-label={`Edit ${listingTitle}`}
      >
        <Edit size={16} className="mr-1" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Edit</span>
      </Link>
      
      <button
        onClick={() => onDeleteClick(listingId, listingTitle)}
        className="text-red-600 hover:text-red-900 inline-flex items-center"
        aria-label={`Delete ${listingTitle}`}
      >
        <Trash2 size={16} className="mr-1" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </button>
    </td>
  );
}
