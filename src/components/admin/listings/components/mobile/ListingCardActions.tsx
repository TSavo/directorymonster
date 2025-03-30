import React from 'react';
import { Listing } from '../../types';

interface ListingCardActionsProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
  onDelete: (listingId: string) => void;
  onDuplicate?: (listing: Listing) => void;
  onView?: (listing: Listing) => void;
  onPublish?: (listing: Listing) => void;
  onArchive?: (listing: Listing) => void;
}

const ListingCardActions: React.FC<ListingCardActionsProps> = ({
  listing,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  onPublish,
  onArchive,
}) => {
  return (
    <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap justify-between gap-2 bg-white" data-testid="listing-card-actions">
      {/* Primary Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(listing)}
          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="listing-edit-button-mobile"
        >
          Edit
        </button>
        
        {onView && (
          <button
            onClick={() => onView(listing)}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="listing-view-button-mobile"
          >
            View
          </button>
        )}
      </div>
      
      {/* Secondary Actions */}
      <div className="flex gap-2">
        {listing.status === 'draft' && onPublish && (
          <button
            onClick={() => onPublish(listing)}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            data-testid="listing-publish-button-mobile"
          >
            Publish
          </button>
        )}
        
        {listing.status === 'published' && onArchive && (
          <button
            onClick={() => onArchive(listing)}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="listing-archive-button-mobile"
          >
            Archive
          </button>
        )}
        
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(listing)}
            className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="listing-duplicate-button-mobile"
          >
            Duplicate
          </button>
        )}
        
        <button
          onClick={() => onDelete(listing.id)}
          className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          data-testid="listing-delete-button-mobile"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ListingCardActions;
