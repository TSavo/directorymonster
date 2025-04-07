'use client';

import { useState, useEffect, useCallback } from 'react';
import { SecurityMetrics } from '../../../../types/security';
import { fetchSecurityMetrics as fetchSecurityMetricsApi } from '../../../../services/securityService';

export interface UseSecurityMetricsProps {
  startDate?: string;
  endDate?: string;
  autoFetch?: boolean;
  fetchApi?: typeof fetchSecurityMetricsApi;
}

/**
 * Hook for fetching and managing security metrics data
 */
export function useSecurityMetrics(props?: UseSecurityMetricsProps) {
  const {
    startDate,
    endDate,
    autoFetch = true,
    fetchApi = fetchSecurityMetricsApi
  } = props || {};

  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch security metrics with optional date range
   */
  const fetchMetrics = useCallback(async (params: UseSecurityMetricsProps = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the provided params or fall back to props
      const queryStartDate = params.startDate || startDate;
      const queryEndDate = params.endDate || endDate;

      const data = await fetchApi(queryStartDate, queryEndDate);
      setMetrics(data);
      return data;
    } catch (err) {
      console.error('Error fetching security metrics:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch security metrics';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, fetchApi]);

  // Auto-fetch on mount or when date range changes
  useEffect(() => {
    if (autoFetch) {
      fetchMetrics({ startDate, endDate });
    }
  }, [autoFetch, fetchMetrics, startDate, endDate]);

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
    // Expose these for testing
    dateRange: { startDate, endDate }
  };
}
