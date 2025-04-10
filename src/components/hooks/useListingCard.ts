'use client';

import { useMemo } from 'react';
import { Listing, SiteConfig } from '@/types';

export interface UseListingCardProps {
  listing: Listing;
  site: SiteConfig;
}

export interface UseListingCardReturn {
  listing: Listing;
  site: SiteConfig;
  ratingValue: number | undefined;
  reviewCount: string;
  hasImage: boolean;
  isFeatured: boolean;
  hasCategory: boolean;
  hasPrice: boolean;
  hasProminentBacklink: boolean;
  hasBrand: boolean;
  hasSku: boolean;
  formattedPrice: string;
}

/**
 * Hook for ListingCard component
 * 
 * Handles data preparation and calculations for the listing card
 */
export function useListingCard({ listing, site }: UseListingCardProps): UseListingCardReturn {
  // Extract rating from custom fields if available
  const ratingValue = useMemo(() => {
    return listing.customFields?.rating ? Number(listing.customFields.rating) : undefined;
  }, [listing.customFields?.rating]);

  // Extract review count from custom fields
  const reviewCount = useMemo(() => {
    return listing.customFields?.review_count
      ? String(listing.customFields.review_count)
      : "1";
  }, [listing.customFields?.review_count]);

  // Check if listing has an image
  const hasImage = useMemo(() => {
    return !!listing.imageUrl;
  }, [listing.imageUrl]);

  // Check if listing is featured
  const isFeatured = useMemo(() => {
    return !!listing.customFields?.featured;
  }, [listing.customFields?.featured]);

  // Check if listing has a category
  const hasCategory = useMemo(() => {
    return !!listing.categoryName;
  }, [listing.categoryName]);

  // Check if listing has a price
  const hasPrice = useMemo(() => {
    return !!listing.customFields?.price;
  }, [listing.customFields?.price]);

  // Check if listing has a prominent backlink
  const hasProminentBacklink = useMemo(() => {
    return listing.backlinkPosition === 'prominent';
  }, [listing.backlinkPosition]);

  // Check if listing has a brand
  const hasBrand = useMemo(() => {
    return !!listing.customFields?.brand;
  }, [listing.customFields?.brand]);

  // Check if listing has a SKU
  const hasSku = useMemo(() => {
    return !!listing.customFields?.sku;
  }, [listing.customFields?.sku]);

  // Format the price
  const formattedPrice = useMemo(() => {
    if (!listing.customFields?.price) return '';
    return `$${String(listing.customFields.price)}`;
  }, [listing.customFields?.price]);

  return {
    listing,
    site,
    ratingValue,
    reviewCount,
    hasImage,
    isFeatured,
    hasCategory,
    hasPrice,
    hasProminentBacklink,
    hasBrand,
    hasSku,
    formattedPrice
  };
}
