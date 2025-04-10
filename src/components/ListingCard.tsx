'use client';

import React from 'react';
import { ListingCardContainer } from './ListingCardContainer';
import { Listing, SiteConfig } from '@/types';

export interface ListingCardProps {
  listing: Listing;
  site: SiteConfig;
}

/**
 * ListingCard Component
 *
 * This component displays a card for a listing with image, title, rating, description, and price.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
export default function ListingCard({ listing, site }: ListingCardProps) {
  return <ListingCardContainer listing={listing} site={site} />;
}