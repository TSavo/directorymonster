'use client';

import React from 'react';
import { ActivityItem } from './types';
import { ActivityFilter } from './components/ActivityFeedFilter';
import { DateRange } from './components/DateRangeSelector';

// Import modular components
import ActivityFeedHeader from './components/ActivityFeedHeader';
import ActivityFeedList from './components/ActivityFeedList';
import ActivityFeedLoading from './components/ActivityFeedLoading';
import ActivityFeedEmpty from './components/ActivityFeedEmpty';
import ActivityFeedError from './components/ActivityFeedError';
import ActivityFeedLoadMore from './components/ActivityFeedLoadMore';
import ActivityFeedFilter from './components/ActivityFeedFilter';
import DateRangeSelector from './components/DateRangeSelector';

export interface ActivityFeedPresentationProps {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  dateRange: DateRange;
  filter: ActivityFilter;
  hasActiveFilters: boolean;
  showHeader?: boolean;
  className?: string;
  onDateRangeChange: (range: DateRange) => void;
  onFilterChange: (filter: ActivityFilter) => void;
  onClearFilters: () => void;
  onLoadMore: () => void;
  onRefresh: () => void;
}

export function ActivityFeedPresentation({
  activities,
  isLoading,
  error,
  hasMore,
  dateRange,
  filter,
  hasActiveFilters,
  showHeader = true,
  className = '',
  onDateRangeChange,
  onFilterChange,
  onClearFilters,
  onLoadMore,
  onRefresh
}: ActivityFeedPresentationProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow border border-gray-100 ${className}`}
      data-testid="activity-feed"
    >
      {/* Header section with title and filter controls */}
      {showHeader && (
        <>
          <ActivityFeedHeader
            onRefresh={onRefresh}
            onFilterChange={onFilterChange}
            currentFilter={filter}
          />

          {/* Filter and date controls row */}
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <ActivityFeedFilter
              onApplyFilter={onFilterChange}
              initialFilter={filter}
            />

            <DateRangeSelector
              onChange={onDateRangeChange}
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
            onRetry={onRefresh}
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
            onClearFilters={onClearFilters}
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
            onClick={onLoadMore}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
