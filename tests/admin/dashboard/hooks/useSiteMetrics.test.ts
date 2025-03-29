import { renderHook, act } from '@testing-library/react';
import { useSiteMetrics } from '../../../../src/components/admin/dashboard/hooks';

// Mock the fetch function or API call
global.fetch = jest.fn();

describe('useSiteMetrics Hook', () => {
  // Create a mock for setTimeout to control async behavior
  jest.useFakeTimers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useSiteMetrics({ siteSlug: 'test-site' }));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns metrics data after loading', async () => {
    const { result, rerender } = renderHook(() => useSiteMetrics({ siteSlug: 'test-site' }));
    
    // Fast-forward through the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force re-render to update the result
    rerender();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).not.toBeNull();
    expect(result.current.metrics?.siteId).toBe('test-site');
    expect(result.current.error).toBeNull();
  });

  it('returns error if siteSlug is missing', () => {
    const { result } = renderHook(() => useSiteMetrics({ siteSlug: '' }));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).toBeNull();
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Site slug is required');
  });

  it('refetches data when refetch is called', async () => {
    const { result } = renderHook(() => useSiteMetrics({ siteSlug: 'test-site' }));
    
    // Initial data load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Call refetch and wait for it to complete
    await act(async () => {
      await result.current.refetch();
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).not.toBeNull();
  });

  it('updates when period changes', () => {
    const { result, rerender } = renderHook(
      (props) => useSiteMetrics(props),
      { initialProps: { siteSlug: 'test-site', period: 'week' } }
    );
    
    // Initial data load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Change period and trigger a re-render
    rerender({ siteSlug: 'test-site', period: 'month' });
    
    // Should go back to loading state
    expect(result.current.isLoading).toBe(true);
    
    // Complete the loading
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.metrics).not.toBeNull();
  });
});
