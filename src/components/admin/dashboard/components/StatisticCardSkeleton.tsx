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
      <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-1"></div>
      <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
    </div>
  );
}

export default StatisticCardSkeleton;