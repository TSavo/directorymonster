/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserActivityLog } from '../UserActivityLog';

describe('UserActivityLog Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockActivities = [
    {
      id: 'activity-1',
      action: 'login',
      resource: 'auth',
      resourceId: null,
      description: 'User logged in',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-01T10:30:00.000Z'
    },
    {
      id: 'activity-2',
      action: 'create',
      resource: 'listing',
      resourceId: 'listing-123',
      description: 'Created new listing "Test Listing"',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-01T11:15:00.000Z'
    },
    {
      id: 'activity-3',
      action: 'update',
      resource: 'user',
      resourceId: 'user-1',
      description: 'Updated profile information',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-02T09:45:00.000Z'
    }
  ];

  const mockOnFilterChange = jest.fn();
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user activity log correctly', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Check that the component title is rendered
    expect(screen.getByText('Activity Log for John Doe')).toBeInTheDocument();
    
    // Check that activities are rendered
    expect(screen.getByText('User logged in')).toBeInTheDocument();
    expect(screen.getByText('Created new listing "Test Listing"')).toBeInTheDocument();
    expect(screen.getByText('Updated profile information')).toBeInTheDocument();
    
    // Check that timestamps are rendered
    expect(screen.getByText('May 1, 2023, 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('May 1, 2023, 11:15 AM')).toBeInTheDocument();
    expect(screen.getByText('May 2, 2023, 9:45 AM')).toBeInTheDocument();
    
    // Check that action badges are rendered
    expect(screen.getByText('login')).toBeInTheDocument();
    expect(screen.getByText('create')).toBeInTheDocument();
    expect(screen.getByText('update')).toBeInTheDocument();
    
    // Check that resource badges are rendered
    expect(screen.getByText('auth')).toBeInTheDocument();
    expect(screen.getByText('listing')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    
    // Check that export button is rendered
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={[]}
        isLoading={true}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    expect(screen.getByTestId('activity-log-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch activity log';
    
    render(
      <UserActivityLog
        user={mockUser}
        activities={[]}
        isLoading={false}
        error={errorMessage}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    expect(screen.getByTestId('activity-log-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={[]}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    expect(screen.getByTestId('activity-log-empty')).toBeInTheDocument();
    expect(screen.getByText('No activity found')).toBeInTheDocument();
  });

  it('filters activities by action', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Open action filter dropdown
    fireEvent.click(screen.getByText('Filter by Action'));
    
    // Select 'login' action
    fireEvent.click(screen.getByText('Login'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      action: 'login'
    }));
  });

  it('filters activities by resource', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Open resource filter dropdown
    fireEvent.click(screen.getByText('Filter by Resource'));
    
    // Select 'listing' resource
    fireEvent.click(screen.getByText('Listing'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      resource: 'listing'
    }));
  });

  it('filters activities by date range', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Open date range filter
    fireEvent.click(screen.getByText('Filter by Date'));
    
    // Select 'Last 7 days' option
    fireEvent.click(screen.getByText('Last 7 days'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      dateRange: 'last7days'
    }));
  });

  it('exports activity log', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Click export button
    fireEvent.click(screen.getByText('Export'));
    
    // Check that onExport was called
    expect(mockOnExport).toHaveBeenCalled();
  });

  it('shows activity details', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        error={null}
        onFilterChange={mockOnFilterChange}
        onExport={mockOnExport}
      />
    );
    
    // Click on an activity to show details
    fireEvent.click(screen.getByText('Created new listing "Test Listing"'));
    
    // Check that details are shown
    await waitFor(() => {
      expect(screen.getByText('Activity Details')).toBeInTheDocument();
    });
    
    // Check that IP address is shown
    expect(screen.getByText('IP Address:')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    
    // Check that user agent is shown
    expect(screen.getByText('User Agent:')).toBeInTheDocument();
    expect(screen.getByText('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBeInTheDocument();
  });
});
