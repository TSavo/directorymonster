'use client';

import React from 'react';
import { useListingCard } from './hooks/useListingCard';
import { ListingCardPresentation } from './ListingCardPresentation';
import { Listing, SiteConfig } from '@/types';

export interface ListingCardContainerProps {
  listing: Listing;
  site: SiteConfig;
}

/**
 * ListingCardContainer Component
 * 
 * Container component that connects the hook and presentation components
 */
export function ListingCardContainer({ listing, site }: ListingCardContainerProps) {
  // Use the hook to get data and handlers
  const listingCardData = useListingCard({ listing, site });
  
  // Return the presentation component with props from hook
  return <ListingCardPresentation {...listingCardData} />;
}
