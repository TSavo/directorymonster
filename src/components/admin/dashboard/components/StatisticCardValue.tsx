"use client";

import React from 'react';

/**
 * Value display for statistic card
 */
interface StatisticCardValueProps {
  title: string;
  value: string | number;
}

export function StatisticCardValue({
  title,
  value,
}: StatisticCardValueProps) {
  return (
    <div
      className="text-2xl sm:text-3xl font-bold text-gradient"
      data-testid="statistic-card-value"
      aria-label={`${title}: ${value}`}
    >
      {value}
    </div>
  );
}

export default StatisticCardValue;