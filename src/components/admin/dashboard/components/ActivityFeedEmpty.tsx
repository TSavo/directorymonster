"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface ActivityFeedEmptyProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
  message?: string;
}

export function ActivityFeedEmpty({
  hasFilters = false,
  onClearFilters,
  message = "No activity found"
}: ActivityFeedEmptyProps) {
  return (
    <div
      className="py-6 text-center text-gray-500"
      data-testid="activity-feed-empty"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-12 w-12 mx-auto text-gray-400 mb-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p>{message}</p>
      {hasFilters && onClearFilters && (
        <Button
          variant="link"
          className="mt-1"
          onClick={onClearFilters}
          data-testid="clear-filters-button"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

export default ActivityFeedEmpty;