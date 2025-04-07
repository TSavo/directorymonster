/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecentActivity } from '@/components/admin/dashboard/components/RecentActivity';
import { useActivityFeed } from '@/components/admin/dashboard/hooks';

// Mock the hooks
jest.mock('@/components/admin/dashboard/hooks', () => ({
  useActivityFeed: jest.fn(),
}));

// Mock the UI components
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('RecentActivity Component', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      userId: 'user-1',
      userName: 'John Doe',
      action: 'created',
      resourceType: 'listing',
      resourceId: 'listing-1',
      resourceName: 'Business Listing',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
      id: 'activity-2',
      userId: 'user-2',
      userName: 'Jane Smith',
      action: 'updated',
      resourceType: 'category',
      resourceId: 'category-1',
      resourceName: 'Restaurants',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: 'activity-3',
      userId: 'user-1',
      userName: 'John Doe',
      action: 'deleted',
      resourceType: 'listing',
      resourceId: 'listing-2',
      resourceName: 'Old Listing',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeletons when data is loading', () => {
    // Mock the hook to return loading state
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecentActivity siteId="site-1" />);

    // Check that skeletons are rendered
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders activity items when loaded successfully', async () => {
    // Mock the hook to return data
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: mockActivities,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecentActivity siteId="site-1" />);

    // Check that activity items are displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Business Listing')).toBeInTheDocument();
      expect(screen.getByText('Restaurants')).toBeInTheDocument();
    });

    // Check that actions are displayed
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
    expect(screen.getByText(/deleted/i)).toBeInTheDocument();
  });

  it('renders empty state when there are no activities', async () => {
    // Mock the hook to return empty data
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<RecentActivity siteId="site-1" />);

    // Check that empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
    });
  });

  it('renders error state when there is an error', async () => {
    // Mock the hook to return error
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: 'Failed to load activity feed',
      refetch: jest.fn(),
    });

    render(<RecentActivity siteId="site-1" />);

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load activity feed')).toBeInTheDocument();
    });

    // Check that retry button is displayed
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const mockRefetch = jest.fn();

    // Mock the hook to return error and refetch function
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: 'Failed to load activity feed',
      refetch: mockRefetch,
    });

    render(<RecentActivity siteId="site-1" />);

    // Find and click the retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Check that refetch was called
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('filters activities by type when filter is applied', async () => {
    const mockRefetch = jest.fn();

    // Mock the hook to return data and refetch function
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: mockActivities,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      filter: { type: 'all' },
      setFilter: jest.fn(),
    });

    render(<RecentActivity siteId="site-1" />);

    // Check that all activities are displayed
    await waitFor(() => {
      expect(screen.getAllByTestId('activity-item').length).toBe(3);
    });

    // Find and click the filter dropdown
    const filterButton = screen.getByRole('button', { name: /filter/i });
    if (filterButton) {
      fireEvent.click(filterButton);
    }

    // Find and click the "Listings" filter option
    const listingsOption = screen.getByText(/listings/i);
    if (listingsOption) {
      fireEvent.click(listingsOption);
    }

    // Check that the filter was applied
    expect(mockRefetch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'listing',
    }));
  });
});
