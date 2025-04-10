'use client';

import React from 'react';
import { useUserActivity, UseUserActivityOptions } from './hooks/useUserActivity';
import { UserActivityPresentation } from './UserActivityPresentation';

export interface UserActivityContainerProps extends UseUserActivityOptions {
  className?: string;
  title?: string;
}

export function UserActivityContainer({
  userId,
  initialPageSize,
  autoFetch,
  fetchService,
  className,
  title
}: UserActivityContainerProps) {
  // Use the custom hook to manage state and data fetching
  const {
    activities,
    isLoading,
    error,
    hasMore,
    searchTerm,
    startDate,
    endDate,
    actionType,
    setSearchTerm,
    setStartDate,
    setEndDate,
    setActionType,
    handleSearch,
    handleApplyFilters,
    handleLoadMore,
    resetFilters
  } = useUserActivity({
    userId,
    initialPageSize,
    autoFetch,
    fetchService
  });

  // Render the presentation component with the data and callbacks
  return (
    <UserActivityPresentation
      activities={activities}
      isLoading={isLoading}
      error={error}
      hasMore={hasMore}
      searchTerm={searchTerm}
      startDate={startDate}
      endDate={endDate}
      actionType={actionType}
      onSearchChange={setSearchTerm}
      onSearch={handleSearch}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      onActionTypeChange={setActionType}
      onApplyFilters={handleApplyFilters}
      onLoadMore={handleLoadMore}
      onResetFilters={resetFilters}
      className={className}
      title={title}
    />
  );
}
