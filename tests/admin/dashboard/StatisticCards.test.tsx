import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatisticCards from '@/components/admin/dashboard/StatisticCards';
import { SiteMetricsData } from '@/components/admin/dashboard/types';

// Mock the hook
const mockUseSiteMetrics = jest.fn();

jest.mock('../../../src/components/admin/dashboard/hooks', () => ({
  __esModule: true,
  useSiteMetrics: () => mockUseSiteMetrics(),
}));

describe('StatisticCards Component', () => {
  const mockMetrics: SiteMetricsData = {
    id: '123',
    siteId: 'test-site',
    listings: {
      total: 100,
      published: 80,
      draft: 20,
      featured: 5,
      change: {
        total: 10,
        isPositive: true,
      },
    },
    categories: {
      total: 25,
      active: 20,
      change: {
        total: 5,
        isPositive: true,
      },
    },
    traffic: {
      pageViews: 5000,
      uniqueVisitors: 2000,
      averageTimeOnSite: 120,
      bounceRate: 40,
      change: {
        pageViews: 500,
        uniqueVisitors: 200,
        isPositive: true,
      },
    },
    search: {
      totalSearches: 1000,
      avgSearchesPerVisitor: 0.5,
      topSearchTerms: [
        { term: 'test', count: 100 },
      ],
      change: {
        searches: 100,
        isPositive: true,
      },
    },
    interactions: {
      clicks: 1500,
      shares: 200,
      saves: 300,
      change: {
        total: 150,
        isPositive: true,
      },
    },
  };

  beforeEach(() => {
    // Reset mock and set default return value
    mockUseSiteMetrics.mockReset();
    mockUseSiteMetrics.mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('renders all statistic cards correctly with hook data', () => {
    render(<StatisticCards siteSlug="test-site" />);

    expect(screen.getByTestId('statistics-section')).toBeInTheDocument();

    // Check for all expected cards
    const cardTitles = screen.getAllByTestId('statistic-card-title');
    expect(cardTitles).toHaveLength(6); // Default + search + interactions

    // Verify some specific values
    expect(screen.getByText('100')).toBeInTheDocument(); // Total Listings
    expect(screen.getByText('20')).toBeInTheDocument(); // Active Categories
    expect(screen.getByText('2,000')).toBeInTheDocument(); // Unique Visitors
    expect(screen.getByText('5,000')).toBeInTheDocument(); // Page Views
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Total Searches
    expect(screen.getByText('1,500')).toBeInTheDocument(); // Interactions
  });

  it('shows loading state when isLoading is true', () => {
    mockUseSiteMetrics.mockReturnValue({
      metrics: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<StatisticCards siteSlug="test-site" />);

    // Check for loading indicators
    const skeletons = screen.getAllByTestId('statistic-card-skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error message when there is an error', () => {
    mockUseSiteMetrics.mockReturnValue({
      metrics: null,
      isLoading: false,
      error: new Error('Test error'),
      refetch: jest.fn(),
    });

    render(<StatisticCards siteSlug="test-site" />);

    expect(screen.getByTestId('metrics-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load metrics: Test error')).toBeInTheDocument();
  });

  it('uses provided metrics from props when available', () => {
    const customMetrics = {
      ...mockMetrics,
      listings: {
        ...mockMetrics.listings,
        total: 999,
      },
    };

    render(<StatisticCards metrics={customMetrics} />);

    // Should use the custom metrics value
    expect(screen.getByText('999')).toBeInTheDocument();

    // Verify the mock was called
    expect(mockUseSiteMetrics).toHaveBeenCalled();
  });

  it('does not show search metrics when showSearchMetrics is false', () => {
    render(<StatisticCards siteSlug="test-site" showSearchMetrics={false} />);

    const cardTitles = screen.getAllByTestId('statistic-card-title');
    expect(cardTitles).toHaveLength(5); // One less than default
    expect(screen.queryByText('Total Searches')).not.toBeInTheDocument();
  });

  it('does not show interaction metrics when showInteractionMetrics is false', () => {
    render(<StatisticCards siteSlug="test-site" showInteractionMetrics={false} />);

    const cardTitles = screen.getAllByTestId('statistic-card-title');
    expect(cardTitles).toHaveLength(5); // One less than default
    expect(screen.queryByText('Interactions')).not.toBeInTheDocument();
  });
});
