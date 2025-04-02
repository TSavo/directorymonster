'use client';

import React, { useState, useEffect } from 'react';
import { ActivityFeedProps, ActivityItem } from './types';

// Import modular components
import ActivityFeedHeader from './components/ActivityFeedHeader';
import ActivityFeedList from './components/ActivityFeedList';
import ActivityFeedLoading from './components/ActivityFeedLoading';
import ActivityFeedEmpty from './components/ActivityFeedEmpty';
import ActivityFeedError from './components/ActivityFeedError';
import ActivityFeedLoadMore from './components/ActivityFeedLoadMore';
import ActivityFeedFilter, { ActivityFilter } from './components/ActivityFeedFilter';
import DateRangeSelector, { DateRange } from './components/DateRangeSelector';
import { useActivityFeed } from './hooks';

/**
 * ActivityFeed component displays a feed of recent activities
 * Uses composition pattern with smaller, specialized components
 *
 * @param {string} siteSlug - Optional site slug to fetch activities for a specific site
 * @param {number} limit - Number of activities to display
 * @param {object} filter - Optional filters for the activity feed
 * @param {boolean} showHeader - Whether to show the header
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the component is in loading state
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  siteSlug,
  limit = 10,
  filter: initialFilter,
  showHeader = true,
  className = '',
  isLoading: propIsLoading,
}) => {
  // Use the hook to get activity data
  const {
    activities,
    isLoading: hookIsLoading,
    error,
    hasMore,
    loadMore: hookLoadMore,
    refresh: hookRefresh,
  } = useActivityFeed({
    siteSlug,
    limit,
    filter: initialFilter,
  });

  // Default date range - last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });

  const [filter, setFilter] = useState<ActivityFilter>(initialFilter || {});

  // Handle filter changes
  const handleFilterChange = (newFilter: ActivityFilter) => {
    setFilter(newFilter);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter({});
    setDateRange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  // Function to load more items
  const loadMore = () => {
    hookLoadMore();
  };

  // Function to refresh the feed
  const refresh = () => {
    hookRefresh();
  };

  // Combine loading state from props and hook
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  // Determine if filters are active
  const hasActiveFilters = Boolean(
    (filter.entityType && filter.entityType.length > 0) ||
    (filter.actionType && filter.actionType.length > 0) ||
    filter.userId
  );

  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-100 ${className}`}
      data-testid="activity-feed"
    >
      {/* Header section with title and filter controls */}
      {showHeader && (
        <>
          <ActivityFeedHeader
            onRefresh={refresh}
            onFilterChange={handleFilterChange}
            currentFilter={filter}
          />

          {/* Filter and date controls row */}
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <ActivityFeedFilter
              onApplyFilter={handleFilterChange}
              initialFilter={filter}
            />

            <DateRangeSelector
              onChange={handleDateRangeChange}
              initialRange={dateRange}
            />
          </div>
        </>
      )}

      {/* Content area */}
      <div className="p-2" data-testid="activity-feed-content">
        {/* Error state */}
        {error && (
          <ActivityFeedError
            message={error.message}
            onRetry={refresh}
          />
        )}

        {/* Loading state */}
        {isLoading && activities.length === 0 && (
          <ActivityFeedLoading count={3} />
        )}

        {/* Empty state */}
        {!isLoading && activities.length === 0 && !error && (
          <ActivityFeedEmpty
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            message={hasActiveFilters ? "No activity matches the current filters" : "No activity found"}
          />
        )}

        {/* Activity items list */}
        {activities.length > 0 && (
          <ActivityFeedList activities={activities} />
        )}

        {/* Load more button */}
        {hasMore && activities.length > 0 && (
          <ActivityFeedLoadMore
            onClick={loadMore}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Also export as default for backward compatibility
export default ActivityFeed;