"use client";

import React from 'react';

/**
 * Trend indicator for statistic card
 */
interface StatisticCardTrendProps {
  change: {
    value: number;
    isPositive: boolean;
  };
}

export function StatisticCardTrend({
  change,
}: StatisticCardTrendProps) {
  return (
    <div
      className="mt-2 flex items-center"
      data-testid="statistic-card-change"
    >
      <div className="flex items-center">
        {change.isPositive ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success-500 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-4.293 4.293A1 1 0 018 14H5.414l2.293 2.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L5.414 10H7.5l1.293-1.293a1 1 0 011.414 0l3.586 3.586V10a1 1 0 112 0z" clipRule="evenodd" />
          </svg>
        )}
        <span
          className={`text-sm font-medium ${
            change.isPositive ? 'text-success-600' : 'text-red-600'
          }`}
          aria-label={`Change: ${change.isPositive ? 'up' : 'down'} by ${change.value}`}
        >
          {change.isPositive ? '+' : '-'}{Math.abs(change.value)}
        </span>
      </div>
      <span className="ml-2 text-xs text-neutral-500">from previous period</span>
    </div>
  );
}

export default StatisticCardTrend;