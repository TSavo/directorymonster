'use client';

import React from 'react';
import { useSiteContext } from '@/components/admin/sites/SiteContext';
import { MetricsOverview } from './components/MetricsOverview';
import { QuickActions } from './components/QuickActions';
import { RecentActivity } from './components/RecentActivity';
import { LatestListings } from './components/LatestListings';
import { CategoryDistribution } from './components/CategoryDistribution';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Main admin dashboard component
 */
export function AdminDashboard() {
  const { currentSite, isLoading, error } = useSiteContext();
  const siteId = currentSite?.id;

  if (isLoading) {
    return (
      <div className="space-y-8" data-testid="dashboard-loading">
        <div>
          <Skeleton className="h-10 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentSite) {
    return (
      <div className="p-8 text-center" data-testid="dashboard-error">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Dashboard Error</h1>
        <p className="text-red-600 mb-4">
          {error || 'No site selected. Please select a site to view the dashboard.'}
        </p>
        <button
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">
          {currentSite ? `${currentSite.name} Dashboard` : 'Dashboard'}
        </h1>

        <MetricsOverview siteId={siteId} />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Quick Actions</h2>
        <QuickActions siteId={siteId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Recent Activity</h2>
          <RecentActivity siteId={siteId} limit={5} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Latest Listings</h2>
          <LatestListings siteId={siteId} limit={5} />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Category Distribution</h2>
        <CategoryDistribution siteId={siteId} />
      </div>
    </div>
  );
}
