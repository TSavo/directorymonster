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
 * Custom hook to fetch and manage security metrics data based on an optional date range.
 *
 * This hook constructs a query string from the provided `startDate` and `endDate`, sends a GET request
 * to the `/api/admin/security/metrics` endpoint, and maintains local state for the retrieved metrics,
 * the loading status, and any errors encountered during the operation.
 *
 * @param props - An object with optional `startDate` and `endDate` properties used to filter the security metrics.
 * @returns An object containing:
 *   - `metrics`: The security metrics data or null if not yet fetched.
 *   - `isLoading`: A boolean that is true while the metrics are being fetched.
 *   - `error`: The error encountered during the fetch, or null if no error occurred.
 *   - `refetch`: A function to manually trigger a re-fetch of the metrics.
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
