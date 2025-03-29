import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityFeed from '../../../src/components/admin/dashboard/ActivityFeed';
import { useActivityFeed } from '../../../src/components/admin/dashboard/hooks';
import { ActivityItem } from '../../../src/components/admin/dashboard/types';

// Mock the hook
jest.mock('../../../src/components/admin/dashboard/hooks', () => ({
  useActivityFeed: jest.fn(),
}));

describe('ActivityFeed Component', () => {
  // Mock activity data
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'creation',
      entityType: 'listing',
      entityId: '123',
      entityName: 'Test Item 1',
      timestamp: new Date().toISOString(),
      userId: 'user1',
      userName: 'John Doe',
    },
    {
      id: '2',
      type: 'update',
      entityType: 'category',
      entityId: '456',
      entityName: 'Test Category',
      timestamp: new Date().toISOString(),
      userId: 'user2',
      userName: 'Jane Doe',
      details: 'Updated description',
    },
  ];

  const mockLoadMore = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    // Reset mock functions
    jest.clearAllMocks();
    
    // Default mock implementation
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: mockActivities,
      isLoading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
  });

  it('renders activity feed with items correctly', () => {
    render(<ActivityFeed siteSlug="test-site" />);
    
    // Check for the main component
    expect(screen.getByTestId('activity-feed')).toBeInTheDocument();
    
    // Check for header
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    
    // Check for activity items
    expect(screen.getByText('Created listing "Test Item 1"')).toBeInTheDocument();
    expect(screen.getByText('Updated category "Test Category"')).toBeInTheDocument();
    
    // Check for load more button
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
  });

  it('calls refresh when refresh button is clicked', () => {
    render(<ActivityFeed siteSlug="test-site" />);
    
    const refreshButton = screen.getByTestId('refresh-button');
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls loadMore when load more button is clicked', () => {
    render(<ActivityFeed siteSlug="test-site" />);
    
    const loadMoreButton = screen.getByTestId('load-more-button');
    fireEvent.click(loadMoreButton);
    
    expect(mockLoadMore).toHaveBeenCalledTimes(1);
  });

  it('does not show the header when showHeader is false', () => {
    render(<ActivityFeed siteSlug="test-site" showHeader={false} />);
    
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
  });

  it('displays loading state when isLoading is true and no activities are available', () => {
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: true,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
    
    render(<ActivityFeed siteSlug="test-site" />);
    
    expect(screen.getByTestId('activity-feed-loading')).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: new Error('Test error'),
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
    
    render(<ActivityFeed siteSlug="test-site" />);
    
    expect(screen.getByTestId('activity-feed-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load activities: Test error')).toBeInTheDocument();
  });

  it('displays empty state when there are no activities', () => {
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
    
    render(<ActivityFeed siteSlug="test-site" />);
    
    expect(screen.getByTestId('activity-feed-empty')).toBeInTheDocument();
    expect(screen.getByText('No activity found')).toBeInTheDocument();
  });

  it('does not show load more button when hasMore is false', () => {
    (useActivityFeed as jest.Mock).mockReturnValue({
      activities: mockActivities,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: mockLoadMore,
      refresh: mockRefresh,
    });
    
    render(<ActivityFeed siteSlug="test-site" />);
    
    expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<ActivityFeed siteSlug="test-site" className="custom-class" />);
    
    expect(screen.getByTestId('activity-feed')).toHaveClass('custom-class');
  });
});
