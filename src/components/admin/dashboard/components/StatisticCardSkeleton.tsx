"use client";

import React from 'react';

/**
 * Loading skeleton for statistic card
 */
export function StatisticCardSkeleton() {
  return (
    <div
      data-testid="statistic-card-skeleton"
      role="status"
      aria-label="Loading statistics"
    >
      <div className="h-8 bg-neutral-200 rounded-md animate-pulse w-3/4 mb-2"></div>
      <div className="h-4 bg-neutral-100 rounded-md animate-pulse w-1/2"></div>
    </div>
  );
}

export default StatisticCardSkeleton;