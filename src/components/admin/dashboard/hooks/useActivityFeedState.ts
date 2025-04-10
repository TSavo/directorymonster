'use client';

import { useState, useCallback, useMemo } from 'react';
import { ActivityItem, UseActivityFeedParams } from '../types';
import { useActivityFeed } from './useActivityFeed';
import { ActivityFilter } from '../components/ActivityFeedFilter';
import { DateRange } from '../components/DateRangeSelector';

export interface UseActivityFeedStateParams extends UseActivityFeedParams {
  initialDateRange?: DateRange;
  initialFilter?: ActivityFilter;
}

export interface UseActivityFeedStateResult {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  dateRange: DateRange;
  filter: ActivityFilter;
  hasActiveFilters: boolean;
  setDateRange: (range: DateRange) => void;
  setFilter: (filter: ActivityFilter) => void;
  clearFilters: () => void;
  loadMore: () => void;
  refresh: () => void;
}

export function useActivityFeedState({
  siteSlug,
  limit = 10,
  filter: initialFilter = {},
  initialDateRange
}: UseActivityFeedStateParams = {}): UseActivityFeedStateResult {
  // Default date range - last 30 days
  const defaultDateRange = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  }, []);

  // Initialize state
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange || defaultDateRange);
  const [filter, setFilter] = useState<ActivityFilter>(initialFilter || {});

  // Use the base activity feed hook
  const {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore: hookLoadMore,
    refresh: hookRefresh,
  } = useActivityFeed({
    siteSlug,
    limit,
    filter: {
      ...filter,
      // Add date range to filter
      dateRange
    },
  });

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilter({});
    setDateRange(defaultDateRange);
  }, [defaultDateRange]);

  // Function to load more items
  const loadMore = useCallback(() => {
    hookLoadMore();
  }, [hookLoadMore]);

  // Function to refresh the feed
  const refresh = useCallback(() => {
    hookRefresh();
  }, [hookRefresh]);

  // Determine if filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filter.entityType && filter.entityType.length > 0) ||
      (filter.actionType && filter.actionType.length > 0) ||
      filter.userId
    );
  }, [filter]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    dateRange,
    filter,
    hasActiveFilters,
    setDateRange,
    setFilter,
    clearFilters,
    loadMore,
    refresh
  };
}
