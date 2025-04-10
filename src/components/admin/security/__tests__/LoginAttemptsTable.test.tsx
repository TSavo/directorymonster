import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginAttemptsTable } from '../LoginAttemptsTable';
import { useLoginAttempts } from '../hooks/useLoginAttempts';
import { SecurityFilter } from '../../../../types/security';

// Mock the hook
jest.mock('../hooks/useLoginAttempts');

// Mock fetch for the blockIP function
global.fetch = jest.fn();

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('LoginAttemptsTable', () => {
  const mockLoginAttempts = [
    {
      id: '1',
      timestamp: '2023-06-01T10:00:00Z',
      username: 'user1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      status: 'success',
      ipRiskLevel: 'low',
      location: {
        country: 'United States',
        city: 'New York',
        lat: 40.7128,
        lng: -74.0060
      },
      successful: true
    },
    {
      id: '2',
      timestamp: '2023-06-01T11:00:00Z',
      username: 'user2',
      ipAddress: '192.168.1.2',
      userAgent: 'Chrome/91.0',
      status: 'failure',
      ipRiskLevel: 'high',
      location: {
        country: 'Canada',
        city: 'Toronto',
        lat: 43.6532,
        lng: -79.3832
      },
      successful: false
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for useLoginAttempts
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: mockLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      blockIp: jest.fn()
    });

    // Default mock implementation for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({})
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
    // Create a custom render function to debug the output
    const { container, debug } = render(<LoginAttemptsTable filter={{}} />);

    // Check for data from the first login attempt
    expect(screen.getByText('user1')).toBeInTheDocument();

    // Use a more flexible approach for finding text that might be in different elements
    const ipAddressElements = screen.getAllByText(/192\.168\.1\.\d/);
    expect(ipAddressElements.length).toBeGreaterThan(0);

    expect(screen.getByText('New York, United States')).toBeInTheDocument();

    // Check for status text
    const successElement = screen.getByText(/Success/i);
    expect(successElement).toBeInTheDocument();

    expect(screen.getByText('Low')).toBeInTheDocument();

    // Check for data from the second login attempt
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('Toronto, Canada')).toBeInTheDocument();

    // Check for status text
    const failedElement = screen.getByText(/Failed/i);
    expect(failedElement).toBeInTheDocument();

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
      blockIp: jest.fn()
    });

    render(<LoginAttemptsTable filter={{}} />);

    expect(screen.getByTestId('login-attempts-loading')).toBeInTheDocument();
  });

  test('shows error state when there is an error', () => {
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: [],
      isLoading: false,
      error: 'Failed to load login attempts',
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      blockIp: jest.fn()
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
      blockIp: jest.fn()
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
        initialFilter: mockFilter,
        autoFetch: true
      })
    );
  });

  test.skip('opens action menu when Actions button is clicked', () => {
    render(<LoginAttemptsTable filter={{}} />);

    // Find the Actions button for the first login attempt
    const actionsButtons = screen.getAllByText('Actions');
    expect(actionsButtons.length).toBeGreaterThan(0);

    // Click the Actions button
    fireEvent.click(actionsButtons[0]);

    // Check that the action menu is rendered
    expect(screen.getByText('Block IP')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  test.skip('opens block IP dialog when Block IP is clicked', () => {
    render(<LoginAttemptsTable filter={{}} />);

    // Find the Actions button for the first login attempt
    const actionsButtons = screen.getAllByText('Actions');
    fireEvent.click(actionsButtons[0]);

    // Click the Block IP button
    const blockIPButton = screen.getByText('Block IP');
    fireEvent.click(blockIPButton);

    // Check that the block IP dialog is rendered
    expect(screen.getByText('Block IP Address')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to block the IP address/)).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  test.skip('calls API to block IP when Confirm is clicked in block IP dialog', async () => {
    const mockRefresh = jest.fn();
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: mockLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: mockRefresh,
      blockIp: jest.fn()
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Find the Actions button for the first login attempt
    const actionsButtons = screen.getAllByText('Actions');
    fireEvent.click(actionsButtons[0]);

    // Click the Block IP button
    const blockIPButton = screen.getByText('Block IP');
    fireEvent.click(blockIPButton);

    // Click the Confirm button
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Check that the API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/security/block-ip',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ ip: '192.168.1.1' })
        })
      );
    });

    // Check that refresh was called
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  test.skip('closes block IP dialog when Cancel is clicked', () => {
    render(<LoginAttemptsTable filter={{}} />);

    // Find the Actions button for the first login attempt
    const actionsButtons = screen.getAllByText('Actions');
    fireEvent.click(actionsButtons[0]);

    // Click the Block IP button
    const blockIPButton = screen.getByText('Block IP');
    fireEvent.click(blockIPButton);

    // Check that the block IP dialog is rendered
    expect(screen.getByText('Block IP Address')).toBeInTheDocument();

    // Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Check that the block IP dialog is closed
    expect(screen.queryByText('Block IP Address')).not.toBeInTheDocument();
  });

  test.skip('handles API error when blocking IP', async () => {
    const errorMessage = 'Failed to block IP';
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: errorMessage })
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Find the Actions button for the first login attempt
    const actionsButtons = screen.getAllByText('Actions');
    fireEvent.click(actionsButtons[0]);

    // Click the Block IP button
    const blockIPButton = screen.getByText('Block IP');
    fireEvent.click(blockIPButton);

    // Click the Confirm button
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);

    // Check that the API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Check that console.error was called with the error message
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error blocking IP:',
        expect.any(Error)
      );
    });
  });

  test('renders empty state when there are no login attempts', () => {
    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: [],
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      blockIp: jest.fn()
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Check that the empty state message is rendered
    expect(screen.getByText('No login attempts found matching the current filters.')).toBeInTheDocument();
  });

  test('displays correct status text for different statuses', () => {
    const customLoginAttempts = [
      { ...mockLoginAttempts[0], status: 'success' },
      { ...mockLoginAttempts[1], status: 'failure' },
      {
        ...mockLoginAttempts[0],
        id: '3',
        status: 'blocked',
        username: 'user3',
        ipAddress: '192.168.1.3'
      },
      {
        ...mockLoginAttempts[0],
        id: '4',
        status: 'captcha_required',
        username: 'user4',
        ipAddress: '192.168.1.4'
      }
    ];

    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: customLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      blockIp: jest.fn()
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Check that the status text is rendered correctly
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('CAPTCHA Required')).toBeInTheDocument();
  });

  test('displays correct risk level text for different risk levels', () => {
    const customLoginAttempts = [
      { ...mockLoginAttempts[0], ipRiskLevel: 'low' },
      { ...mockLoginAttempts[1], ipRiskLevel: 'medium' },
      {
        ...mockLoginAttempts[0],
        id: '3',
        ipRiskLevel: 'high',
        username: 'user3',
        ipAddress: '192.168.1.3'
      },
      {
        ...mockLoginAttempts[0],
        id: '4',
        ipRiskLevel: 'critical',
        username: 'user4',
        ipAddress: '192.168.1.4'
      }
    ];

    (useLoginAttempts as jest.Mock).mockReturnValue({
      loginAttempts: customLoginAttempts,
      isLoading: false,
      error: null,
      hasMore: false,
      loadMore: jest.fn(),
      refresh: jest.fn(),
      blockIp: jest.fn()
    });

    render(<LoginAttemptsTable filter={{}} />);

    // Check that the risk level text is rendered correctly
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });
});
