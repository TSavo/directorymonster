/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminDashboard } from '@/components/admin/dashboard/AdminDashboard';

// Mock the child components
jest.mock('@/components/admin/dashboard/components/MetricsOverview', () => ({
  MetricsOverview: ({ siteId }: { siteId: string }) => (
    <div data-testid="metrics-overview" data-site-id={siteId}>
      Metrics Overview
    </div>
  ),
}));

jest.mock('@/components/admin/dashboard/components/RecentActivity', () => ({
  RecentActivity: ({ siteId }: { siteId: string }) => (
    <div data-testid="recent-activity" data-site-id={siteId}>
      Recent Activity
    </div>
  ),
}));

jest.mock('@/components/admin/dashboard/components/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));

jest.mock('@/components/admin/dashboard/components/LatestListings', () => ({
  LatestListings: ({ siteId }: { siteId: string }) => (
    <div data-testid="latest-listings" data-site-id={siteId}>
      Latest Listings
    </div>
  ),
}));

jest.mock('@/components/admin/dashboard/components/CategoryDistribution', () => ({
  CategoryDistribution: ({ siteId }: { siteId: string }) => (
    <div data-testid="category-distribution" data-site-id={siteId}>
      Category Distribution
    </div>
  ),
}));

// Mock the site context
jest.mock('@/components/admin/sites/SiteContext', () => ({
  useSiteContext: () => ({
    currentSite: { id: 'site-1', name: 'Test Site' },
    isLoading: false,
  }),
}));

describe('AdminDashboard Component', () => {
  it('renders all dashboard components', async () => {
    render(<AdminDashboard />);

    // Check that all components are rendered
    await waitFor(() => {
      expect(screen.getByTestId('metrics-overview')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
      expect(screen.getByTestId('latest-listings')).toBeInTheDocument();
      expect(screen.getByTestId('category-distribution')).toBeInTheDocument();
    });
  });

  it('passes the current site ID to child components', async () => {
    render(<AdminDashboard />);

    // Check that site ID is passed to components
    await waitFor(() => {
      expect(screen.getByTestId('metrics-overview')).toHaveAttribute('data-site-id', 'site-1');
      expect(screen.getByTestId('recent-activity')).toHaveAttribute('data-site-id', 'site-1');
      expect(screen.getByTestId('latest-listings')).toHaveAttribute('data-site-id', 'site-1');
      expect(screen.getByTestId('category-distribution')).toHaveAttribute('data-site-id', 'site-1');
    });
  });

  it('renders loading state when site context is loading', async () => {
    // Override the mock to return loading state
    jest.spyOn(require('@/components/admin/sites/SiteContext'), 'useSiteContext').mockReturnValue({
      currentSite: null,
      isLoading: true,
    });

    render(<AdminDashboard />);

    // Check that loading state is rendered
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    });

    // Restore the original mock
    jest.restoreAllMocks();
  });

  it('renders error state when no site is selected', async () => {
    // Override the mock to return no site
    jest.spyOn(require('@/components/admin/sites/SiteContext'), 'useSiteContext').mockReturnValue({
      currentSite: null,
      isLoading: false,
    });

    render(<AdminDashboard />);

    // Check that error state is rendered
    await waitFor(() => {
      expect(screen.getByText(/no site selected/i)).toBeInTheDocument();
    });

    // Restore the original mock
    jest.restoreAllMocks();
  });
});
