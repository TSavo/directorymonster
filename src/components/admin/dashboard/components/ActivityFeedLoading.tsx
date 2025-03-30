"use client";

import React from 'react';

interface ActivityFeedLoadingProps {
  count?: number;
}

export function ActivityFeedLoading({ count = 3 }: ActivityFeedLoadingProps) {
  return (
    <div data-testid="activity-feed-loading" role="status" aria-label="Loading activities">
      {[...Array(count)].map((_, index) => (
        <div key={index} className="flex items-start space-x-3 py-3 px-3 animate-pulse">
          <div className="bg-gray-200 rounded-full h-10 w-10"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityFeedLoading;