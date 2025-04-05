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
 * Custom hook for fetching and managing login attempts data.
 *
 * This hook retrieves login attempts from an API endpoint based on provided filter criteria and a configurable limit. It automatically
 * fetches data on initial render and whenever the filter or limit changes, handling pagination with an offset state. The hook exposes
 * methods to load additional attempts or refresh the data entirely.
 *
 * @param limit - Maximum number of login attempts to fetch per request (default is 10).
 * @param filter - Optional criteria for filtering login attempts, such as date range, status, IP risk level, or user identifier.
 *
 * @returns An object containing:
 *  - loginAttempts: Array of fetched login attempts.
 *  - isLoading: Boolean indicating the loading state.
 *  - error: Any error encountered during the fetch.
 *  - hasMore: Flag indicating if more login attempts are available.
 *  - loadMore: Function to fetch the next set of login attempts.
 *  - refresh: Function to reset pagination and re-fetch login attempts.
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

      if (reset) {
        setLoginAttempts(data.loginAttempts);
        setOffset(data.loginAttempts.length);
      } else {
        setLoginAttempts(prev => [...prev, ...data.loginAttempts]);
        setOffset(prev => prev + data.loginAttempts.length);
      }

      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, filter]);

  useEffect(() => {
    // Convert filter to string for comparison
    const filterString = JSON.stringify(filter);
    
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
