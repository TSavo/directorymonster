'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserActivity } from '../../../types/security';
import ActivitySearch from './activity/ActivitySearch';
import ActivityFilters from './activity/ActivityFilters';
import ActivityTable from './activity/ActivityTable';

export interface UserActivityPresentationProps {
  activities: UserActivity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  searchTerm: string;
  startDate: Date | null;
  endDate: Date | null;
  actionType: string;
  onSearchChange: (term: string) => void;
  onSearch: () => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onActionTypeChange: (type: string) => void;
  onApplyFilters: () => void;
  onLoadMore: () => void;
  onResetFilters: () => void;
  className?: string;
  title?: string;
}

export function UserActivityPresentation({
  activities,
  isLoading,
  error,
  hasMore,
  searchTerm,
  startDate,
  endDate,
  actionType,
  onSearchChange,
  onSearch,
  onStartDateChange,
  onEndDateChange,
  onActionTypeChange,
  onApplyFilters,
  onLoadMore,
  onResetFilters,
  className = '',
  title = 'User Activity Tracker'
}: UserActivityPresentationProps) {
  return (
    <Card className={className} data-testid="user-activity-tracker">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ActivitySearch
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            onSearch={onSearch}
            data-testid="activity-search"
          />

          <ActivityFilters
            startDate={startDate}
            endDate={endDate}
            actionType={actionType}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onActionTypeChange={onActionTypeChange}
            onApplyFilters={onApplyFilters}
            onResetFilters={onResetFilters}
            data-testid="activity-filters"
          />

          <ActivityTable
            activities={activities}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            data-testid="activity-table"
          />
        </div>
      </CardContent>
    </Card>
  );
}
