/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsOverview } from '@/components/admin/dashboard/components/MetricsOverview';
import { useSiteMetrics } from '@/components/admin/dashboard/hooks';

// Mock the hooks
jest.mock('@/components/admin/dashboard/hooks', () => ({
  useSiteMetrics: jest.fn(),
}));

// Mock the UI components
jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div data-testid="skeleton" className={className} {...props} />
  ),
}));

describe('MetricsOverview Component', () => {
  const mockMetrics = {
    totalListings: 150,
    totalCategories: 12,
    totalUsers: 45,
    activeListings: 120,
    pendingListings: 30,
    listingsTrend: 15, // 15% increase
    usersTrend: 8, // 8% increase
    categoriesTrend: -2, // 2% decrease
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeletons when data is loading', () => {
    // Mock the hook to return loading state
    (useSiteMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<MetricsOverview siteId="site-1" />);

    // Check that skeletons are rendered
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders metrics data when loaded successfully', async () => {
    // Mock the hook to return data
    (useSiteMetrics as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<MetricsOverview siteId="site-1" />);

    // Check that metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument(); // Total users
    });

    // Check that the component has the correct data-site-id attribute
    expect(screen.getByTestId('metrics-overview')).toHaveAttribute('data-site-id', 'site-1');
  });

  it('renders error state when there is an error', async () => {
    // Mock the hook to return error
    (useSiteMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      isLoading: false,
      error: 'Failed to load metrics',
      refetch: jest.fn(),
    });

    render(<MetricsOverview siteId="site-1" />);

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to load metrics/)).toBeInTheDocument();
    });

    // Check that retry button is displayed
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls refetch when retry button is clicked', async () => {
    const mockRefetch = jest.fn();

    // Mock the hook to return error and refetch function
    (useSiteMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      isLoading: false,
      error: 'Failed to load metrics',
      refetch: mockRefetch,
    });

    render(<MetricsOverview siteId="site-1" />);

    // Find and click the retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryButton);

    // Check that refetch was called
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('updates when siteId changes', async () => {
    const mockRefetch = jest.fn();

    // Mock the hook to return data and refetch function
    (useSiteMetrics as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    const { rerender } = render(<MetricsOverview siteId="site-1" />);

    // Check that metrics are displayed for site-1
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    // Update the siteId prop
    rerender(<MetricsOverview siteId="site-2" />);

    // Check that the component has the correct data-site-id attribute
    expect(screen.getByTestId('metrics-overview')).toHaveAttribute('data-site-id', 'site-2');
  });
});
