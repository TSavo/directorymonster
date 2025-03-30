'use client';

import { ListingTableRowProps } from '../types';
import { formatDate, getBacklinkStatus } from '../utils';
import { ListingTableActions } from './ListingTableActions';

/**
 * Individual row component for the listing table
 */
export function ListingTableRow({ 
  listing, 
  siteSlug, 
  showSiteColumn,
  onDeleteClick 
}: ListingTableRowProps & { onDeleteClick: (id: string, title: string) => void }) {
  const { status, label } = getBacklinkStatus(listing.backlinkVerifiedAt);
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium text-gray-900 truncate max-w-xs">
        {listing.title}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-500">
        {listing.categoryName || 'Unknown Category'}
      </td>
      
      {showSiteColumn && (
        <td className="px-6 py-4 text-sm text-gray-500">
          {listing.siteName || 'Unknown Site'}
        </td>
      )}
      
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(listing.updatedAt)}
      </td>
      
      <td className="px-6 py-4 text-sm whitespace-nowrap">
        {status === 'verified' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {label}
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {label}
          </span>
        )}
      </td>
      
      <ListingTableActions
        listingId={listing.id}
        listingSlug={listing.slug}
        listingTitle={listing.title}
        siteSlug={siteSlug}
        onDeleteClick={onDeleteClick}
      />
    </tr>
  );
}

// Enable both named and default exports
export default ListingTableRow;
