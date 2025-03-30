import React from 'react';
import { Listing } from '../../types';
import { formatDate } from '../../../utils/dateUtils';

interface ListingCardContentProps {
  listing: Listing;
}

const ListingCardContent: React.FC<ListingCardContentProps> = ({ listing }) => {
  return (
    <div className="px-4 py-3 bg-white" data-testid="listing-card-content">
      {/* Listing Image */}
      {listing.imageUrl && (
        <div className="mb-3">
          <img 
            src={listing.imageUrl} 
            alt={listing.title} 
            className="h-24 w-full object-cover rounded-lg"
            data-testid="listing-card-image"
          />
        </div>
      )}
      
      {/* Listing Details */}
      <div className="space-y-2">
        {/* Category */}
        <div className="flex items-start">
          <span className="text-gray-500 text-sm w-24 flex-shrink-0">Category:</span>
          <span className="text-sm text-gray-900" data-testid="listing-card-category">
            {listing.category ? listing.category.name : 'Uncategorized'}
          </span>
        </div>
        
        {/* Description (truncated) */}
        <div className="flex items-start">
          <span className="text-gray-500 text-sm w-24 flex-shrink-0">Description:</span>
          <span 
            className="text-sm text-gray-900 line-clamp-2" 
            data-testid="listing-card-description"
          >
            {listing.description || 'No description provided'}
          </span>
        </div>
        
        {/* Price */}
        {listing.price !== undefined && (
          <div className="flex items-start">
            <span className="text-gray-500 text-sm w-24 flex-shrink-0">Price:</span>
            <span 
              className="text-sm text-gray-900 font-medium" 
              data-testid="listing-card-price"
            >
              ${typeof listing.price === 'number' ? listing.price.toFixed(2) : listing.price}
            </span>
          </div>
        )}
        
        {/* Created / Updated Date */}
        <div className="flex items-start">
          <span className="text-gray-500 text-sm w-24 flex-shrink-0">Created:</span>
          <span 
            className="text-sm text-gray-900" 
            data-testid="listing-card-created-date"
          >
            {formatDate(listing.createdAt)}
          </span>
        </div>
        
        {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
          <div className="flex items-start">
            <span className="text-gray-500 text-sm w-24 flex-shrink-0">Updated:</span>
            <span 
              className="text-sm text-gray-900" 
              data-testid="listing-card-updated-date"
            >
              {formatDate(listing.updatedAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingCardContent;
