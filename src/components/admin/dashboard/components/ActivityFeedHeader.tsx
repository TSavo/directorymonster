"use client";

import React from 'react';
import { RefreshIcon } from './StatisticIcons';
import { ActivityFilter } from './ActivityFeedFilter';
import { Button } from '@/components/ui/Button';

interface ActivityFeedHeaderProps {
  onRefresh: () => void;
  onFilterChange: (filter: ActivityFilter) => void;
  currentFilter?: ActivityFilter;
  title?: string;
}

export function ActivityFeedHeader({
  onRefresh,
  onFilterChange,
  currentFilter,
  title = "Recent Activity"
}: ActivityFeedHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
      <h3
        className="text-lg font-medium text-gray-900"
        data-testid="activity-feed-title"
      >
        {title}
      </h3>

      <div className="flex items-center space-x-2">
        <Button
          onClick={onRefresh}
          variant="ghost"
          size="icon"
          className="text-gray-500"
          data-testid="refresh-button"
          aria-label="Refresh activity feed"
        >
          <RefreshIcon />
        </Button>
      </div>
    </div>
  );
}

export default ActivityFeedHeader;