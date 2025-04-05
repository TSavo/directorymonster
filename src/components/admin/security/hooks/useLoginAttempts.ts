'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LoginAttempt {
  id: string;
  timestamp: string;
  username: string;
  ip: string;
  userAgent: string;
  success: boolean;
  ipRiskLevel: string;
  location: {
    country: string;
    city: string;
    latitude: number;
    longitude: number;
  };
  details?: Record<string, any>;
}

export interface LoginAttemptsFilter {
  status?: string[];
  ipRiskLevel?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UseLoginAttemptsProps {
  limit?: number;
  filter?: LoginAttemptsFilter;
}

/**
 * A custom React hook that fetches and manages login attempts with pagination.
 *
 * This hook retrieves login attempts from the security API endpoint, applying optional filters and a limit per request.
 * It manages state for the login attempts, loading status, error handling, and pagination, and provides methods to load more data or refresh the list.
 * The hook automatically triggers fetching on the initial render and when the filter or limit changes.
 *
 * @param props - Configuration options for fetching login attempts.
 *   - limit: Maximum number of login attempts to fetch per request (default is 10).
 *   - filter: Optional criteria to filter login attempts, which may include status, IP risk level, user ID, start date, and end date.
 *
 * @returns An object containing:
 *   - loginAttempts: Array of fetched login attempts.
 *   - isLoading: Boolean indicating whether data is currently being loaded.
 *   - error: An error object if fetching fails, or null if no error occurred.
 *   - hasMore: Boolean indicating whether more login attempts can be fetched.
 *   - loadMore: Function to load the next set of login attempts.
 *   - refresh: Function to refresh the login attempts list by resetting the offset.
 */
export function useLoginAttempts({ limit = 10, filter = {} }: UseLoginAttemptsProps) {
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [offset, setOffset] = useState<number>(0);

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Use a ref to track the previous filter to avoid unnecessary fetches
  const prevFilterRef = useRef<string>('');
  const prevLimitRef = useRef<number>(limit);

  const fetchLoginAttempts = useCallback(async (reset: boolean = true) => {
    console.log('[useLoginAttempts] fetchLoginAttempts called, reset:', reset, 'filter:', JSON.stringify(filter), 'limit:', limit, 'offset:', offset);
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());

      if (!reset) {
        queryParams.append('offset', offset.toString());
      }

      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);

      if (filter.status && filter.status.length > 0) {
        filter.status.forEach(status => {
          queryParams.append('status', status);
        });
      }

      if (filter.ipRiskLevel && filter.ipRiskLevel.length > 0) {
        filter.ipRiskLevel.forEach(level => {
          queryParams.append('ipRiskLevel', level);
        });
      }

      if (filter.userId) queryParams.append('userId', filter.userId);

      const url = `/api/admin/security/login-attempts?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching login attempts: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useLoginAttempts] Data fetched successfully:', data.loginAttempts.length, 'attempts, hasMore:', data.hasMore);

      if (reset) {
        setLoginAttempts(data.loginAttempts);
        setOffset(data.loginAttempts.length);
        console.log('[useLoginAttempts] Reset data and set offset to:', data.loginAttempts.length);
      } else {
        setLoginAttempts(prev => [...prev, ...data.loginAttempts]);
        setOffset(prev => prev + data.loginAttempts.length);
        console.log('[useLoginAttempts] Appended data and increased offset by:', data.loginAttempts.length);
      }

      setHasMore(data.hasMore);
    } catch (err) {
      console.error('[useLoginAttempts] Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      console.log('[useLoginAttempts] Fetch operation completed, setting isLoading to false');
      setIsLoading(false);
    }
  }, [limit, offset, filter]);

  useEffect(() => {
    // Convert filter to string for comparison
    const filterString = JSON.stringify(filter);

    console.log('[useLoginAttempts] Effect triggered, filter:', filterString, 'limit:', limit);

    // Only fetch if this is the first render or if the filter or limit has changed
    if (isFirstRender.current ||
        filterString !== prevFilterRef.current ||
        limit !== prevLimitRef.current) {

      // Update refs
      isFirstRender.current = false;
      prevFilterRef.current = filterString;
      prevLimitRef.current = limit;

      // Reset offset and fetch data
      setOffset(0);
      fetchLoginAttempts(true);
    }

    // Cleanup function to help with debugging
    return () => {
      console.log('[useLoginAttempts] Effect cleanup, filter was:', filterString, 'limit was:', limit);
    };
  }, [fetchLoginAttempts, filter, limit]);

  const loadMore = async () => {
    if (!isLoading && hasMore) {
      await fetchLoginAttempts(false);
    }
  };

  const refresh = async () => {
    setOffset(0);
    await fetchLoginAttempts(true);
  };

  return {
    loginAttempts,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
