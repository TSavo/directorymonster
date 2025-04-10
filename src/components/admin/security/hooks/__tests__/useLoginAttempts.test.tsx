import { renderHook, act } from '@testing-library/react-hooks';
import { useLoginAttempts } from '../useLoginAttempts';
import { LoginAttempt, SecurityFilter } from '../../../../../types/security';

// Mock login attempts data
const mockLoginAttempts: LoginAttempt[] = [
  {
    id: '1',
    timestamp: '2023-06-01T10:00:00Z',
    username: 'user1',
    ipAddress: '192.168.1.1',
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
    ipAddress: '192.168.1.2',
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

// Mock API functions
const mockFetchLoginAttempts = jest.fn();
const mockBlockIpAddress = jest.fn();

describe('useLoginAttempts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchLoginAttempts.mockResolvedValue(mockLoginAttempts);
    mockBlockIpAddress.mockResolvedValue(undefined);
  });

  test('should initialize with empty login attempts', () => {
    const { result } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: false,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    expect(result.current.loginAttempts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
  });

  test('should fetch login attempts on mount when autoFetch is true', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: true,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loginAttempts).toEqual(mockLoginAttempts);
    expect(result.current.error).toBeNull();
    expect(mockFetchLoginAttempts).toHaveBeenCalledTimes(1);
    expect(mockFetchLoginAttempts).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10
    });
  });

  test('should fetch login attempts with filter', async () => {
    const filter: SecurityFilter = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      status: ['success']
    };

    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        initialFilter: filter,
        autoFetch: true,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Wait for data to load
    await waitForNextUpdate();

    // Verify API call with filter
    expect(mockFetchLoginAttempts).toHaveBeenCalledWith({
      ...filter,
      page: 1,
      pageSize: 10
    });
  });

  test('should handle API errors', async () => {
    const errorMessage = 'API error';
    mockFetchLoginAttempts.mockRejectedValueOnce(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: true,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Wait for error
    await waitForNextUpdate();

    // After error
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loginAttempts).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  test('should manually fetch login attempts', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: false,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Manually fetch data
    act(() => {
      result.current.fetchLoginAttempts();
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loginAttempts).toEqual(mockLoginAttempts);
    expect(result.current.error).toBeNull();
  });

  test('should block an IP address', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: true,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Wait for initial data load
    await waitForNextUpdate();

    // Block an IP
    let success;
    await act(async () => {
      success = await result.current.blockIp('192.168.1.1');
    });

    // Verify API call and result
    expect(mockBlockIpAddress).toHaveBeenCalledWith('192.168.1.1');
    expect(success).toBe(true);
    
    // Verify state update
    const updatedAttempts = result.current.loginAttempts;
    const blockedAttempt = updatedAttempts.find(a => a.ipAddress === '192.168.1.1');
    expect(blockedAttempt?.status).toBe('blocked');
  });

  test('should handle error when blocking IP', async () => {
    mockBlockIpAddress.mockRejectedValueOnce(new Error('Failed to block IP'));

    const { result, waitForNextUpdate } = renderHook(() => 
      useLoginAttempts({ 
        autoFetch: true,
        fetchApi: mockFetchLoginAttempts,
        blockIpApi: mockBlockIpAddress
      })
    );

    // Wait for initial data load
    await waitForNextUpdate();

    // Try to block an IP
    let success;
    await act(async () => {
      success = await result.current.blockIp('192.168.1.1');
    });

    // Verify result and error state
    expect(success).toBe(false);
    expect(result.current.error).toBe('Failed to block IP');
  });
});
