'use client';

import React from 'react';
import { ActivityFeedProps } from './types';
import { useActivityFeedState, UseActivityFeedStateParams } from './hooks/useActivityFeedState';
import { ActivityFeedPresentation } from './ActivityFeedPresentation';

export interface ActivityFeedContainerProps extends ActivityFeedProps {
  activityFeedHook?: typeof useActivityFeedState;
}

export function ActivityFeedContainer({
  siteSlug,
  limit = 10,
  filter: initialFilter,
  showHeader = true,
  className = '',
  isLoading: propIsLoading,
  activityFeedHook = useActivityFeedState
}: ActivityFeedContainerProps) {
  // Use the activity feed state hook
  const {
    activities,
    isLoading: hookIsLoading,
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
  } = activityFeedHook({
    siteSlug,
    limit,
    filter: initialFilter
  });

  // Combine loading state from props and hook
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  return (
    <ActivityFeedPresentation
      activities={activities}
      isLoading={isLoading}
      error={error}
      hasMore={hasMore}
      dateRange={dateRange}
      filter={filter}
      hasActiveFilters={hasActiveFilters}
      showHeader={showHeader}
      className={className}
      onDateRangeChange={setDateRange}
      onFilterChange={setFilter}
      onClearFilters={clearFilters}
      onLoadMore={loadMore}
      onRefresh={refresh}
    />
  );
}
