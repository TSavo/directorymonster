import { renderHook, act } from '@testing-library/react';
import { useActivityFeed } from '../../../../src/components/admin/dashboard/hooks';

// Mock the fetch function or API call
global.fetch = jest.fn();

describe('useActivityFeed Hook', () => {
  // Create a mock for setTimeout to control async behavior
  jest.useFakeTimers();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useActivityFeed({ siteSlug: 'test-site' }));
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.activities).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns activities after loading', async () => {
    const { result, rerender } = renderHook(() => useActivityFeed({ siteSlug: 'test-site' }));
    
    // Fast-forward through the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force re-render to update the result
    rerender();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activities.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('applies filters correctly', async () => {
    const filter = {
      entityType: ['listing'] as const,
      actionType: ['creation'] as const,
    };
    
    const { result, rerender } = renderHook(() => 
      useActivityFeed({ siteSlug: 'test-site', filter })
    );
    
    // Fast-forward through the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force re-render to update the result
    rerender();
    
    // Check that all activities match the filter criteria
    result.current.activities.forEach(activity => {
      expect(activity.entityType).toBe('listing');
      expect(activity.type).toBe('creation');
    });
  });

  it('returns empty array when no activities match filters', async () => {
    const filter = {
      // Using a non-existent user ID to ensure no matches
      userId: 'non-existent-user',
    };
    
    const { result, rerender } = renderHook(() => 
      useActivityFeed({ siteSlug: 'test-site', filter })
    );
    
    // Fast-forward through the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force re-render to update the result
    rerender();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activities).toEqual([]);
  });

  it('handles loadMore correctly', async () => {
    const { result } = renderHook(() => useActivityFeed({ siteSlug: 'test-site', limit: 5 }));
    
    // Initial data load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Store initial count
    const initialCount = result.current.activities.length;
    
    // Call loadMore and wait for it to complete
    await act(async () => {
      result.current.loadMore();
      jest.advanceTimersByTime(1000);
    });
    
    // Should have more activities after loadMore
    expect(result.current.activities.length).toBeGreaterThan(initialCount);
  });

  it('refreshes data when refresh is called', async () => {
    const { result } = renderHook(() => useActivityFeed({ siteSlug: 'test-site' }));
    
    // Initial data load
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Call refresh and wait for it to complete
    await act(async () => {
      await result.current.refresh();
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activities.length).toBeGreaterThan(0);
  });

  it('sorts activities by timestamp (newest first)', async () => {
    const { result, rerender } = renderHook(() => useActivityFeed({ siteSlug: 'test-site' }));
    
    // Fast-forward through the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Force re-render to update the result
    rerender();
    
    // Check that activities are sorted by timestamp (newest first)
    const timestamps = result.current.activities.map(activity => 
      new Date(activity.timestamp).getTime()
    );
    
    const sortedTimestamps = [...timestamps].sort((a, b) => b - a);
    expect(timestamps).toEqual(sortedTimestamps);
  });
});
