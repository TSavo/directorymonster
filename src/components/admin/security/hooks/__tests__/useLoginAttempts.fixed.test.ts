import { renderHook, act } from '@testing-library/react-hooks';
import { useLoginAttempts } from '../useLoginAttempts.fixed';
import { waitForNextUpdate } from '../../../../../tests/utils/testing-library-hooks-fix';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Sample login attempts data for testing
const mockLoginAttempts = [
  {
    id: '1',
    timestamp: '2023-01-15T10:30:00Z',
    username: 'user1',
    ip: '192.168.1.1',
    userAgent: 'Chrome/96.0',
    success: true,
    ipRiskLevel: 'low',
    location: {
      country: 'United States',
      city: 'New York',
      latitude: 40.7128,
      longitude: -74.0060
    }
  }
];

describe('useLoginAttempts (fixed)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  test('fetches login attempts on initial render', async () => {
    // Setup mock response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        loginAttempts: mockLoginAttempts,
        hasMore: false
      })
    });

    // Render the hook
    const { result } = renderHook(() => 
      useLoginAttempts({
        limit: 10,
        filter: {
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      })
    );

    // Initial state should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.loginAttempts).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the data to load
    await waitForNextUpdate();

    // Verify data is loaded
    expect(result.current.isLoading).toBe(false);
    expect(result.current.loginAttempts).toEqual(mockLoginAttempts);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();

    // Verify API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain('limit=10');
    expect(url).toContain('startDate=2023-01-01');
    expect(url).toContain('endDate=2023-01-31');
  });
});
