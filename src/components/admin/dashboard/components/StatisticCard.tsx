import React from 'react';
import { StatisticCardProps } from '../types';

/**
 * Individual statistic card component that displays a single metric
 * 
 * @param {string} title - The title of the metric
 * @param {string|number} value - The value of the metric
 * @param {object} change - Optional object containing change data
 * @param {React.ReactNode} icon - Optional icon to display
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the component is in loading state
 */
export function StatisticCard({
  title,
  value,
  change,
  icon,
  className = '',
  isLoading = false,
}: StatisticCardProps) {
  return (
    <div
      data-testid="statistic-card"
      className={`bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-shadow ${className}`}
      aria-busy={isLoading}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 
          className="text-sm font-medium text-gray-500"
          data-testid="statistic-card-title"
        >
          {title}
        </h3>
        {icon && (
          <div className="text-gray-400 p-1 rounded-full bg-gray-50">
            {icon}
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div data-testid="statistic-card-skeleton">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-1"></div>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
        </div>
      ) : (
        <>
          <div 
            className="text-3xl font-bold text-gray-800"
            data-testid="statistic-card-value"
            aria-label={`${title}: ${value}`}
          >
            {value}
          </div>
          
          {change && (
            <div 
              className="mt-1 flex items-center"
              data-testid="statistic-card-change"
            >
              <span
                className={`text-sm font-medium ${
                  change.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
                aria-label={`Change: ${change.isPositive ? 'up' : 'down'} by ${change.value}`}
              >
                {change.isPositive ? '+' : '-'}{Math.abs(change.value)}
              </span>
              <span className="ml-2 text-xs text-gray-500">from previous period</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Add default export for dual-export pattern
export default StatisticCard;
