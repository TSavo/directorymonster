import React from 'react';
import { Listing, ListingStatus } from '../../types';

interface ListingCardHeaderProps {
  listing: Listing;
}

const getStatusColorClass = (status: ListingStatus): string => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: ListingStatus): string => {
  switch (status) {
    case 'published':
      return 'Published';
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending Review';
    case 'archived':
      return 'Archived';
    default:
      return 'Unknown';
  }
};

const ListingCardHeader: React.FC<ListingCardHeaderProps> = ({ listing }) => {
  const statusColorClass = getStatusColorClass(listing.status);
  const statusLabel = getStatusLabel(listing.status);

  return (
    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white" data-testid="listing-card-header">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 truncate" data-testid="listing-card-title">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1" data-testid="listing-card-id">
          ID: {listing.id.substring(0, 8)}
        </p>
      </div>
      <div>
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}
          data-testid="listing-card-status"
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

export default ListingCardHeader;
