"use client";

import React from 'react';

/**
 * Header for statistic card component
 */
interface StatisticCardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onRefresh?: () => void;
}

export function StatisticCardHeader({
  title,
  subtitle,
  icon,
  onRefresh,
}: StatisticCardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div>
        <h3 
          className="text-sm font-medium text-gray-500"
          data-testid="statistic-card-title"
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5" data-testid="statistic-card-subtitle">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {onRefresh && (
          <button 
            onClick={onRefresh} 
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={`Refresh ${title} statistics`}
            data-testid="statistic-card-refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        {icon && (
          <div className="text-gray-400 p-1 rounded-full bg-gray-50" data-testid="statistic-icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatisticCardHeader;