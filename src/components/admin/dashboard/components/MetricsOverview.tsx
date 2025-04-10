'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSiteMetrics } from '@/components/admin/dashboard/hooks';
import { Button } from '@/components/ui/Button';

interface MetricsOverviewProps {
  siteId?: string;
}

/**
 * Component to display key metrics on the admin dashboard
 */
export function MetricsOverview({ siteId }: MetricsOverviewProps) {
  const { metrics, isLoading, error, refetch } = useSiteMetrics(siteId ? { siteSlug: siteId } : { siteSlug: 'default' });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="metrics-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600" data-testid="metrics-error">
        <p>Error: {error.message || 'Failed to load metrics'}</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-2"
          onClick={refetch}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-4 text-neutral-600" data-testid="metrics-empty">
        No metrics available
      </div>
    );
  }

  // Map the metrics data to the format expected by the component
  const displayMetrics = {
    totalListings: metrics.listings?.total || 0,
    totalCategories: metrics.categories?.total || 0,
    totalUsers: 45, // Not provided in the metrics data, using a placeholder
    activeSubmissions: metrics.listings?.published || 0,
    pendingReviews: metrics.listings?.draft || 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="metrics-overview" data-site-id={siteId}>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-neutral-900">Content</h3>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Listings</p>
            <p className="text-2xl font-semibold">{displayMetrics.totalListings}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Categories</p>
            <p className="text-2xl font-semibold">{displayMetrics.totalCategories}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-neutral-900">Users</h3>
        <div className="mt-2">
          <p className="text-sm text-neutral-500">Total Users</p>
          <p className="text-2xl font-semibold">{displayMetrics.totalUsers}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-neutral-900">Submissions</h3>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Active</p>
            <p className="text-2xl font-semibold">{displayMetrics.activeSubmissions}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Pending Review</p>
            <p className="text-2xl font-semibold">{displayMetrics.pendingReviews}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
