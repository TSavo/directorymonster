'use client';

import { useState, useCallback, useEffect } from 'react';
import { LoginAttempt, SecurityFilter } from '../../../../types/security';
import { fetchLoginAttempts as fetchLoginAttemptsApi, blockIpAddress } from '../../../../services/securityService';

export interface UseLoginAttemptsProps {
  initialFilter?: SecurityFilter;
  autoFetch?: boolean;
  fetchApi?: typeof fetchLoginAttemptsApi;
  blockIpApi?: typeof blockIpAddress;
  defaultPageSize?: number;
}

/**
 * Hook for managing login attempts data with pagination and filtering
 */
export function useLoginAttempts(props?: UseLoginAttemptsProps) {
  const {
    initialFilter = {},
    autoFetch = true,
    fetchApi = fetchLoginAttemptsApi,
    blockIpApi = blockIpAddress,
    defaultPageSize = 10
  } = props || {};

  const [filter, setFilter] = useState<SecurityFilter>(initialFilter);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(defaultPageSize);

  /**
   * Fetch login attempts with optional filtering
   */
  const fetchLoginAttempts = useCallback(async (newFilter?: SecurityFilter) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the filter state if a new filter is provided
      if (newFilter) {
        setFilter(newFilter);
      }

      // Reset page if filter changes
      if (newFilter && newFilter !== filter) {
        setPage(1);
      }

      // Combine filter with pagination
      const queryFilter = {
        ...newFilter || filter,
        page: 1,
        pageSize
      };

      const data = await fetchApi(queryFilter);

      setLoginAttempts(data);
      setHasMore(data.length === pageSize);
      return data;
    } catch (err) {
      console.error('Error fetching login attempts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch login attempts';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filter, pageSize, fetchApi]);

  /**
   * Load more login attempts (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return [];

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;

      // Combine filter with pagination
      const queryFilter = {
        ...filter,
        page: nextPage,
        pageSize
      };

      const data = await fetchApi(queryFilter);

      setLoginAttempts(prev => [...prev, ...data]);
      setHasMore(data.length === pageSize);
      setPage(nextPage);
      return data;
    } catch (err) {
      console.error('Error loading more login attempts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more login attempts';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filter, hasMore, isLoading, page, pageSize, fetchApi]);

  /**
   * Refresh the data with current filters
   */
  const refresh = useCallback(() => {
    return fetchLoginAttempts(filter);
  }, [fetchLoginAttempts, filter]);

  /**
   * Block an IP address
   */
  const blockIp = useCallback(async (ip: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await blockIpApi(ip);

      // Update the local state to reflect the blocked IP
      setLoginAttempts(prev =>
        prev.map(attempt =>
          attempt.ipAddress === ip
            ? { ...attempt, status: 'blocked' }
            : attempt
        )
      );

      return true;
    } catch (err) {
      console.error('Error blocking IP:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to block IP';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [blockIpApi]);

  // Auto-fetch on mount or when filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchLoginAttempts();
    }
  }, [autoFetch, fetchLoginAttempts]);

  return {
    loginAttempts,
    isLoading,
    error,
    hasMore,
    fetchLoginAttempts,
    loadMore,
    refresh,
    blockIp,
    // Expose these for testing
    filter,
    page,
    pageSize
  };
}
