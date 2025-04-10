'use client';

import React from 'react';
import Image from 'next/image';
import { Listing, SiteConfig } from '@/types';
import { ListingLink } from './LinkUtilities';

export interface ListingCardPresentationProps {
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
 * ListingCardPresentation Component
 * 
 * Pure UI component for rendering a listing card
 */
export function ListingCardPresentation({
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
}: ListingCardPresentationProps) {
  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-md"
      data-testid="listing-card"
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: listing.title,
            description: listing.description,
            ...(hasImage && { image: listing.imageUrl }),
            ...(hasPrice && { offers: {
              '@type': 'Offer',
              price: listing.customFields?.price,
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock'
            }}),
            ...(ratingValue && { 
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: ratingValue,
                reviewCount: reviewCount
              }
            }),
            ...(hasBrand && { brand: {
              '@type': 'Brand',
              name: listing.customFields?.brand
            }}),
            ...(hasSku && { sku: listing.customFields?.sku })
          })
        }}
      />

      {/* Featured badge */}
      {isFeatured && (
        <div className="absolute top-2 right-2 z-10">
          <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800">
            Featured
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative pt-[56.25%] bg-neutral-100">
        {hasImage ? (
          <Image
            src={listing.imageUrl as string}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
            data-testid="listing-image"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <svg
              className="h-12 w-12 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category */}
        {hasCategory && (
          <div className="mb-1">
            <span className="text-xs font-medium text-primary-600" data-testid="listing-category">
              {listing.categoryName}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="mb-2 text-lg font-medium text-neutral-900 group-hover:text-primary-600" data-testid="listing-title">
          <ListingLink listing={listing} site={site}>
            {listing.title}
          </ListingLink>
        </h3>

        {/* Rating */}
        {ratingValue && (
          <div className="mb-2 flex items-center" data-testid="listing-rating">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(ratingValue) ? 'text-yellow-400' : 'text-neutral-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-xs text-neutral-500">
              ({reviewCount} {parseInt(reviewCount) === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}

        {/* Description */}
        <p className="mb-4 flex-1 text-sm text-neutral-600 line-clamp-3" data-testid="listing-description">
          {listing.description}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between">
          {/* Price */}
          {hasPrice && (
            <div className="text-lg font-semibold text-neutral-900" data-testid="listing-price">
              {formattedPrice}
            </div>
          )}

          {/* CTA Button */}
          <div className="ml-auto">
            <ListingLink listing={listing} site={site}>
              <span className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
                View Details
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </ListingLink>
          </div>
        </div>

        {/* Backlink (if prominent) */}
        {hasProminentBacklink && listing.backlinkUrl && (
          <div className="mt-3 text-xs text-neutral-500">
            <a
              href={listing.backlinkUrl}
              target="_blank"
              rel={site.defaultLinkAttributes === 'dofollow' ? '' : 'nofollow'}
              className="hover:text-primary-600 hover:underline"
              data-testid="listing-backlink"
            >
              {listing.backlinkText || 'Visit Website'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
