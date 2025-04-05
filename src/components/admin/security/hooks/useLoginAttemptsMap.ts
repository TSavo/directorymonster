'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoginAttemptsFilter } from './useLoginAttempts';

export interface MapDataPoint {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  successCount: number;
  failedCount: number;
  ipRiskLevel: string;
  location: string;
}

export interface UseLoginAttemptsMapProps {
  filter?: LoginAttemptsFilter;
}

/**
 * Retrieves and manages login attempts map data for visualization.
 *
 * This hook fetches login attempt data based on optional filter criteria and maintains internal
 * state for the retrieved data, loading status, and any errors encountered. It also provides a
 * refresh function to manually re-trigger the data fetch.
 *
 * @param filter - Optional filter criteria including start and end dates, statuses, IP risk levels, and a user ID.
 *
 * @returns An object containing:
 *   - mapData: An array of fetched map data points.
 *   - isLoading: A boolean indicating whether the data is currently being loaded.
 *   - error: An Error instance if fetching data fails; otherwise, null.
 *   - refresh: A function to manually re-fetch the map data based on the current filter.
 */
export function useLoginAttemptsMap({ filter = {} }: UseLoginAttemptsMapProps) {
  const [mapData, setMapData] = useState<MapDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);

  // Use a ref to track the previous filter to avoid unnecessary fetches
  const prevFilterRef = useRef<string>('');

  const fetchMapData = useCallback(async () => {
    console.log('[useLoginAttemptsMap] fetchMapData called, filter:', JSON.stringify(filter));
    setIsLoading(true);
    setError(null);

    try {
      // Build query string
      const queryParams = new URLSearchParams();

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

      const url = `/api/admin/security/login-attempts-map?${queryParams.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching map data: ${response.status}`);
      }

      const data = await response.json();
      console.log('[useLoginAttemptsMap] Data fetched successfully:', data.mapData.length, 'points');
      setMapData(data.mapData);
    } catch (err) {
      console.error('[useLoginAttemptsMap] Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      console.log('[useLoginAttemptsMap] Fetch operation completed, setting isLoading to false');
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // Convert filter to string for comparison
    const filterString = JSON.stringify(filter);

    console.log('[useLoginAttemptsMap] Effect triggered, filter:', filterString);

    // Only fetch if this is the first render or if the filter has changed
    if (isFirstRender.current || filterString !== prevFilterRef.current) {
      // Update refs
      isFirstRender.current = false;
      prevFilterRef.current = filterString;

      // Fetch data
      fetchMapData();
    }

    // Cleanup function to help with debugging
    return () => {
      console.log('[useLoginAttemptsMap] Effect cleanup, filter was:', filterString);
    };
  }, [fetchMapData, filter]);

  return {
    mapData,
    isLoading,
    error,
    refresh: fetchMapData,
  };
}
