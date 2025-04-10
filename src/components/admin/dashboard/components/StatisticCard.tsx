"use client";

import React from 'react';
import { StatisticCardProps } from '../types';
import StatisticCardHeader from './StatisticCardHeader';
import StatisticCardSkeleton from './StatisticCardSkeleton';
import StatisticCardValue from './StatisticCardValue';
import StatisticCardTrend from './StatisticCardTrend';

/**
 * Individual statistic card component that displays a single metric
 *
 * @param {string} title - The title of the metric
 * @param {string|number} value - The value of the metric
 * @param {object} change - Optional object containing change data
 * @param {React.ReactNode} icon - Optional icon to display
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the component is in loading state
 * @param {string} subtitle - Optional subtitle text
 * @param {function} onRefresh - Optional callback for refreshing data
 */
export function StatisticCard({
  title,
  value,
  change,
  icon,
  className = '',
  isLoading = false,
  subtitle,
  onRefresh,
}: StatisticCardProps) {
  return (
    <div
      data-testid="statistic-card"
      className={`bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-neutral-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1 ${className}`}
      aria-busy={isLoading}
    >
      <StatisticCardHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        onRefresh={onRefresh}
      />

      {isLoading ? (
        <StatisticCardSkeleton />
      ) : (
        <>
          <StatisticCardValue title={title} value={value} />

          {change && <StatisticCardTrend change={change} />}
        </>
      )}
    </div>
  );
}

// Add default export for dual-export pattern
export default StatisticCard;
