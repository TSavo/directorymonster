'use client';

import React from 'react';
import { useListings } from '../hooks/useListings';
import { useSites } from '../../sites/hooks/useSites';
import Link from 'next/link';

interface ListingDetailPanelProps {
  listingId: string;
}

export function ListingDetailPanel({ listingId }: ListingDetailPanelProps) {
  const { getListingById, isLoading: listingLoading, error: listingError } = useListings();
  const { getSiteById, isLoading: siteLoading, error: siteError } = useSites();
  
  const listing = getListingById(listingId);
  const site = listing?.siteId ? getSiteById(listing.siteId) : null;
  
  if (listingLoading) {
    return <div>Loading listing details...</div>;
  }
  
  if (listingError) {
    return <div>Error loading listing: {listingError.message}</div>;
  }
  
  if (!listing) {
    return <div>Listing not found</div>;
  }
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{listing.title}</h2>
      <p className="text-gray-700 mb-6">{listing.description}</p>
      
      {/* Site information section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold mb-2">Site Information</h3>
        
        {listing.siteId ? (
          <div data-testid="listing-site-info" className="bg-gray-50 p-4 rounded">
            {siteLoading ? (
              <div data-testid="site-info-loading" className="animate-pulse">
                Loading site information...
              </div>
            ) : siteError ? (
              <div data-testid="site-info-error" className="text-red-500">
                {siteError.message || 'Failed to load site information'}
              </div>
            ) : site ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Site Name:</p>
                    <p data-testid="listing-site-name" className="text-gray-700">{site.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Domain:</p>
                    <p data-testid="listing-site-domain" className="text-gray-700">{site.domain}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Link 
                    href={`/admin/sites/${site.id}`}
                    data-testid="listing-site-link"
                    className="text-blue-600 hover:underline"
                  >
                    View Site Details
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-yellow-600">Site information not available</div>
            )}
          </div>
        ) : (
          <div data-testid="listing-no-site-message" className="bg-gray-50 p-4 rounded">
            <p className="text-gray-700">No site associated</p>
            <button 
              data-testid="assign-site-button"
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Assign to a Site
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListingDetailPanel;
