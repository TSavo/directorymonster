'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  blockedAttempts: number;
  captchaRequiredCount: number;
  highRiskIPs: number;
  successRate?: number;
  failureRate?: number;
}

export interface UseSecurityMetricsProps {
  startDate?: string;
  endDate?: string;
}

/**
 * Retrieves and manages security metrics based on an optional date range.
 *
 * This custom React hook fetches security metrics from the `/api/admin/security/metrics` endpoint.
 * It maintains state for the metrics data, loading status, and any error encountered during the fetch operation.
 * The hook automatically retrieves data on the initial render and whenever the provided date range changes,
 * and it offers a `refetch` function to manually trigger data fetching.
 *
 * @param props - An object with optional filtering properties:
 *   - startDate: The starting date used to filter metrics.
 *   - endDate: The ending date used to filter metrics.
 * @returns An object containing:
 *   - metrics: The fetched security metrics data, or null if not yet loaded.
 *   - isLoading: A boolean indicating whether the metrics are currently being fetched.
 *   - error: An error object if the fetch operation fails, or null.
 *   - refetch: A function to manually trigger the fetch of security metrics.
 */
export function useSecurityMetrics({ startDate, endDate }: UseSecurityMetricsProps) {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Use a ref to track the previous date range to avoid unnecessary fetches
  const prevDateRangeRef = useRef<string>('');

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const queryString = queryParams.toString();
      const url = `/api/admin/security/metrics${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching security metrics: ${response.status}`);
      }

      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    // Convert date range to string for comparison
    const dateRangeString = JSON.stringify({ startDate, endDate });

    // Only fetch if this is the first render or if the date range has changed
    if (isFirstRender.current || dateRangeString !== prevDateRangeRef.current) {
      // Update refs
      isFirstRender.current = false;
      prevDateRangeRef.current = dateRangeString;

      // Fetch data
      fetchMetrics();
    }
  }, [fetchMetrics, startDate, endDate]);

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
  };
}
