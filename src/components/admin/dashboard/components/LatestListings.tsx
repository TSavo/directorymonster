'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Listing {
  id: string;
  title: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  categoryName: string;
  categoryId: string;
  viewCount: number;
}

interface LatestListingsProps {
  siteId?: string;
  limit?: number;
}

/**
 * Component to display latest listings on the admin dashboard
 */
export function LatestListings({ siteId, limit = 5 }: LatestListingsProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real implementation, this would fetch from the API
        const url = siteId 
          ? `/api/admin/listings?siteId=${siteId}&limit=${limit}` 
          : `/api/admin/listings?limit=${limit}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch listings');
        }

        const data = await response.json();
        setListings(data.listings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [siteId, limit]);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="listings-loading">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600" data-testid="listings-error">
        Error: {error}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="p-4 text-neutral-600" data-testid="listings-empty">
        No listings available
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="latest-listings" data-site-id={siteId}>
      {listings.map((listing) => (
        <div 
          key={listing.id} 
          className="bg-white p-4 rounded-lg shadow"
          data-testid="listing-item"
        >
          <div className="flex justify-between">
            <div>
              <Link 
                href={siteId ? `/admin/sites/${siteId}/listings/${listing.id}` : `/admin/listings/${listing.id}`}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                {listing.title}
              </Link>
              <p className="text-xs text-neutral-500">
                Category: {listing.categoryName} • 
                {listing.viewCount} views • 
                Updated {formatDistanceToNow(new Date(listing.updatedAt), { addSuffix: true })}
              </p>
            </div>
            <div className="text-xs">
              <span className={`px-2 py-1 rounded-full ${getStatusColor(listing.status)}`}>
                {listing.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800';
    case 'archived':
      return 'bg-neutral-100 text-neutral-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
}
