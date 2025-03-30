"use client";

import React from 'react';

interface ActivityFeedLoadMoreProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ActivityFeedLoadMore({
  onClick,
  isLoading = false,
  disabled = false,
}: ActivityFeedLoadMoreProps) {
  return (
    <div className="pt-2 pb-3 px-4 text-center">
      <button
        onClick={onClick}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        disabled={isLoading || disabled}
        data-testid="load-more-button"
      >
        {isLoading ? 'Loading...' : 'Load more'}
      </button>
    </div>
  );
}

export default ActivityFeedLoadMore;