import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginAttemptsTable } from '../LoginAttemptsTable';
import { useLoginAttempts } from '../hooks/useLoginAttempts';

// Mock the hook
jest.mock('../hooks/useLoginAttempts');

describe('LoginAttemptsTable', () => {
  const mockLoginAttempts = [
    {
      id: '1',
      timestamp: '2023-06-01T10:00:00Z',
      username: 'user1',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      success: true,
      ipRiskLevel: 'low',
      location: {
        country: 'United States',
        city: 'New York',
        latitude: 40.7128,
        longitude: -74.0060
      }
    },
    {
      id: '2',
      timestamp: '2023-06-01T11:00:00Z',
      username: 'user2',
      ip: '192.168.1.2',
      userAgent: 'Chrome/91.0',
      success: false,
      ipRiskLevel: 'high',
      location: {
        country: 'Canada',
        city: 'Toronto',
        latitude: 43.6532,
        longitude: -79.3832
      }
    }
  ];

  beforeEach(() => {
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: mockLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });
  });

  test('renders login attempts table with correct columns', () => {
    render(<LoginAttemptsTable filter={{}} />);

    // Check for column headers
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('IP Address')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getAllByText('Actions')[0]).toBeInTheDocument();
  });

  test('displays login attempt data correctly', () => {
    render(<LoginAttemptsTable filter={{}} />);

    // Check for data from the first login attempt
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('New York, United States')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();

    // Check for data from the second login attempt
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
    expect(screen.getByText('Toronto, Canada')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('shows loading state when data is loading', () => {
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: [],
      isLoading: true,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });

    render(<LoginAttemptsTable filter={{}} />);

    expect(screen.getByTestId('login-attempts-loading')).toBeInTheDocument();
  });

  test('shows error state when there is an error', () => {
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: [],
      isLoading: false,
      error: new Error('Failed to load login attempts'),
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
    });

    render(<LoginAttemptsTable filter={{}} />);

    expect(screen.getByText('Failed to load login attempts')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('loads more data when "Load More" button is clicked', () => {
    const mockLoadMore = jest.fn();
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: mockLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: true,
      loadMore: mockLoadMore,
      refresh: jest.fn(),
    });

    render(<LoginAttemptsTable filter={{}} />);

    fireEvent.click(screen.getByText('Load More'));

    expect(mockLoadMore).toHaveBeenCalled();
  });

  test('applies filters correctly', () => {
    const mockFilter = {
      status: ['success'],
      ipRiskLevel: ['high'],
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    render(<LoginAttemptsTable filter={mockFilter} />);

    expect(useLoginAttempts).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: mockFilter
      })
    );
  });

  test('allows blocking an IP address', async () => {
    const mockRefresh = jest.fn();
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: mockLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: mockRefresh,
    });

    // Mock fetch for the API call
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Open action menu for the first login attempt
    fireEvent.click(screen.getAllByText('Actions')[1]);

    // Click "Block IP" option
    fireEvent.click(screen.getByText('Block IP'));

    // Confirm in the dialog
    fireEvent.click(screen.getByText('Confirm'));

    // Verify API call was made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/security/block-ip',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('192.168.1.1')
        })
      );
    });

    // Verify table was refreshed
    expect(mockRefresh).toHaveBeenCalled();
  });
});
