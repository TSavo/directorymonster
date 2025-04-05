import { renderHook } from '@testing-library/react-hooks';
import { useLoginAttempts } from '../useLoginAttempts';

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

describe('useLoginAttempts debug test', () => {
  // Single test with extensive logging
  test('debug test with logging', () => {
    console.log('[TEST] Starting debug test');
    
    // Setup mock response
    console.log('[TEST] Setting up mock fetch response');
    mockFetch.mockImplementation(() => {
      console.log('[MOCK] Fetch called');
      return Promise.resolve({
        ok: true,
        json: () => {
          console.log('[MOCK] json() called');
          return Promise.resolve({
            loginAttempts: mockLoginAttempts,
            hasMore: false
          });
        }
      });
    });
    
    console.log('[TEST] About to render hook');
    
    // Just render the hook and check initial state
    const { result } = renderHook(() => {
      console.log('[HOOK] Hook function called');
      return useLoginAttempts({
        limit: 5,
        filter: {
          startDate: '2023-01-01',
          endDate: '2023-01-31'
        }
      });
    });
    
    console.log('[TEST] Hook rendered, initial state:', {
      isLoading: result.current.isLoading,
      loginAttemptsLength: result.current.loginAttempts.length,
      error: result.current.error,
      hasMore: result.current.hasMore
    });
    
    // Only verify the initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.loginAttempts).toEqual([]);
    expect(result.current.error).toBeNull();
    
    console.log('[TEST] Test completed');
  });
});
