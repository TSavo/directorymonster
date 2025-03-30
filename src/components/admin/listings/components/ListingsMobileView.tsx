'use client';

import { formatDate, getBacklinkStatus } from '../utils';
import { ListingWithRelations } from '../types';

interface ListingsMobileViewProps {
  listings: ListingWithRelations[];
  showSiteColumn: boolean;
  onDeleteClick: (id: string, title: string) => void;
  siteSlug?: string;
}

/**
 * Mobile-friendly view of listings that replaces the table for smaller screens
 */
export function ListingsMobileView({ 
  listings, 
  showSiteColumn, 
  onDeleteClick,
  siteSlug 
}: ListingsMobileViewProps) {
  return (
    <div className="md:hidden space-y-4">
      {listings.map((listing) => {
        const { status, label } = getBacklinkStatus(listing.backlinkVerifiedAt);
        
        return (
          <div key={listing.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900">{listing.title}</h3>
              <div className={status === 'verified' 
                ? "px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800" 
                : "px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
              }>
                {label}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-500">
              <div>Category:</div>
              <div>{listing.categoryName || 'Unknown'}</div>
              
              {showSiteColumn && (
                <>
                  <div>Site:</div>
                  <div>{listing.siteName || 'Unknown'}</div>
                </>
              )}
              
              <div>Last Updated:</div>
              <div>{formatDate(listing.updatedAt)}</div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2 border-t">
              <a 
                href={siteSlug ? `/admin/${siteSlug}/listings/${listing.slug}` : `/admin/listings/${listing.id}`}
                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
              >
                View
              </a>
              <a 
                href={siteSlug ? `/admin/${siteSlug}/listings/${listing.slug}/edit` : `/admin/listings/${listing.id}/edit`}
                className="text-amber-600 hover:text-amber-900 text-sm font-medium"
              >
                Edit
              </a>
              <button
                onClick={() => onDeleteClick(listing.id, listing.title)}
                className="text-red-600 hover:text-red-900 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Enable both named and default exports
export default ListingsMobileView;
