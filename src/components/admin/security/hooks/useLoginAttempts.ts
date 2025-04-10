import { LoginAttempt } from './types/LoginAttempt'; // Ensure the correct import path

// Other imports and code...

import { LoginAttempt } from './types'; // Ensure the correct import path

// Other imports and code...

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
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);

  /**
   * Fetch login attempts with optional filtering
   */
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('Fetching login attempts with filter:', newFilter ? newFilter : filter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('Fetching login attempts with filter:', newFilter || filter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
  const fetchLoginAttempts = useCallback(async (newFilter?: SecurityFilter) => {
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
    setIsLoading(true);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
    setError(null);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);

let data: LoginAttempt[] = []; // Initialize data
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Received login attempts data:', data);
    try {
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
      // Update the filter state if a new filter is provided
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
      if (newFilter) {
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
        setFilter(newFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      }
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);

let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      // Reset page if filter changes
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
console.log('Received more login attempts data:', data);
      if (newFilter && newFilter !== filter) {
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
        setPage(1);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      }
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);

let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      // Combine filter with pagination
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
      const queryFilter = {
console.log('IP blocked successfully',);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
        ...newFilter || filter,
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received login attempts data:', data);
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
console.log('Received login attempts data:', data);
        page: 1,
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
console.log('Received login attempts data:', data);
        pageSize
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
console.log('Received login attempts data:', data);
      };
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
console.log('Received login attempts data:', data);

console.log('Received login attempts data:', data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      const data = await fetchApi(queryFilter);

      setLoginAttempts(data);
console.log('IP blocked successfully');
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
      setHasMore(data.length === pageSize);
      return data;
    } catch (err) {
console.log('IP blocked successfully');
      console.error('Error fetching login attempts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch login attempts';
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
      setError(errorMessage);
console.log('IP blocked successfully');
      return [];
    } finally {
console.log('Blocking IP:', ip);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
console.log('Received more login attempts data:', data);
      setIsLoading(false);
console.log('Blocking IP:', ip);
    }
  }, [filter, pageSize, fetchApi]);

  /**
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
console.log('Received more login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Blocking IP:', ip);
console.log('Loading more login attempts with filter:', queryFilter);
   * Load more login attempts (pagination)
   */
  const loadMore = useCallback(async () => {
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
console.log('Received more login attempts data:', data);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Blocking IP:', ip);
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
    if (isLoading || !hasMore) return [];

console.log('IP blocked successfully');
    setIsLoading(true);
let queryFilter = { ...filter, page: nextPage, pageSize }; // Initialize queryFilter
console.log('Blocking IP:', ip);
console.log('Loading more login attempts with filter:', queryFilter);
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);
    setError(null);

console.log('IP blocked successfully');
console.log('Loading more login attempts with filter:', queryFilter);
    try {
      const nextPage = page + 1;
let data: LoginAttempt[] = []; // Initialize data
console.log('Received more login attempts data:', data);

console.log('Blocking IP:', ip);
      // Combine filter with pagination
      const queryFilter = {
        ...filter,
        page: nextPage,
let data: LoginAttempt[] = []; // Initialize data
console.log('IP blocked successfully');
console.log('Received more login attempts data:', data);
        pageSize
console.log('Blocking IP:', ip);
      };

console.log('Received more login attempts data:', data);
      const data = await fetchApi(queryFilter);

console.log('IP blocked successfully');
      setLoginAttempts(prev => [...prev, ...data]);
      setHasMore(data.length === pageSize);
      setPage(nextPage);
      return data;
    } catch (err) {
      console.error('Error loading more login attempts:', err);
console.log('Blocking IP:', ip);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more login attempts';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
console.log('IP blocked successfully');
    }
  }, [filter, hasMore, isLoading, page, pageSize, fetchApi]);
console.log('Blocking IP:', ip);

  /**
   * Refresh the data with current filters
   */
  const refresh = useCallback(() => {
console.log('IP blocked successfully');
    return fetchLoginAttempts(filter);
  }, [fetchLoginAttempts, filter]);
console.log('Blocking IP:', ip);

  /**
   * Block an IP address
   */
console.log('Blocking IP:', ip);
console.log('IP blocked successfully');
  const blockIp = useCallback(async (ip: string) => {
    setIsLoading(true);
    setError(null);

    try {
console.log('IP blocked successfully');
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
