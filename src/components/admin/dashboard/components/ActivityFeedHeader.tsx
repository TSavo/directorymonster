"use client";

import React from 'react';
import { RefreshIcon } from './StatisticIcons';
import { ActivityFilter } from './ActivityFeedFilter';

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
        <button
          onClick={onRefresh}
          className="inline-flex items-center p-1.5 text-sm text-gray-500 rounded-lg hover:bg-gray-100"
          data-testid="refresh-button"
          aria-label="Refresh activity feed"
        >
          <RefreshIcon />
        </button>
      </div>
    </div>
  );
}

export default ActivityFeedHeader;