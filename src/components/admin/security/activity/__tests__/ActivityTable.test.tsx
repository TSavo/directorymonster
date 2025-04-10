import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityTable } from '../ActivityTable';
import { UserActivity } from '@/types/security';

// Mock the date-fns library
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago')
}));

describe('ActivityTable', () => {
  const mockActivities: UserActivity[] = [
    {
      id: '1',
      userId: 'user1',
      username: 'user1@example.com',
      action: 'login',
      timestamp: '2023-06-01T10:00:00Z',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      details: { browser: 'Chrome', os: 'Windows' },
      status: 'success'
    },
    {
      id: '2',
      userId: 'user2',
      username: 'user2@example.com',
      action: 'password_change',
      timestamp: '2023-06-01T11:00:00Z',
      ipAddress: '192.168.1.2',
      userAgent: 'Firefox/91.0',
      details: { browser: 'Firefox', os: 'MacOS' },
      status: 'success'
    }
  ];

  const mockProps = {
    activities: mockActivities,
    isLoading: false,
    error: null,
    hasMore: false,
    onLoadMore: jest.fn()
  };

  it('renders the table with headers', () => {
    render(<ActivityTable {...mockProps} />);

    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renders activity data correctly', () => {
    render(<ActivityTable {...mockProps} />);

    // Check for data from the first activity
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getAllByText('success')[0]).toBeInTheDocument();

    // Check for data from the second activity
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.getByText('password_change')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
  });

  it('shows a loading indicator when isLoading is true', () => {
    const loadingProps = {
      ...mockProps,
      isLoading: true,
      activities: []
    };

    render(<ActivityTable {...loadingProps} />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading activities...')).toBeInTheDocument();
  });

  it('shows an error message when there is an error', () => {
    const errorProps = {
      ...mockProps,
      error: 'Failed to load activities',
      activities: []
    };

    render(<ActivityTable {...errorProps} />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
  });

  it('shows a message when there are no activities', () => {
    const emptyProps = {
      ...mockProps,
      activities: []
    };

    render(<ActivityTable {...emptyProps} />);

    expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    expect(screen.getByText('No activities found')).toBeInTheDocument();
  });

  it('shows a load more button when hasMore is true', () => {
    const hasMoreProps = {
      ...mockProps,
      hasMore: true
    };

    render(<ActivityTable {...hasMoreProps} />);

    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('does not show a load more button when hasMore is false', () => {
    render(<ActivityTable {...mockProps} />);

    expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
  });
});
