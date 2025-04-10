'use client';

import React, { useState } from 'react';
import { useSiteMetrics } from './hooks';
import { StatisticCardsProps } from './types';
import StatisticCard from './components/StatisticCard';
import {
  ListingIcon,
  CategoryIcon,
  VisitorIcon,
  SearchIcon,
  InteractionIcon
} from './components/StatisticIcons';
import { PeriodSelector, TimePeriod } from './components/PeriodSelector';
import MetricsError from './components/MetricsError';
import StatisticsContainer from './components/StatisticsContainer';

/**
 * StatisticCards component displays key site metrics in card format
 *
 * @param {string} siteSlug - Optional site slug to fetch metrics for a specific site
 * @param {SiteMetricsData} metrics - Optional pre-fetched metrics data
 * @param {boolean} showSearchMetrics - Whether to show search-related metrics
 * @param {boolean} showInteractionMetrics - Whether to show interaction-related metrics
 * @param {boolean} isLoading - Whether the component is in loading state
 * @param {string} className - Additional CSS classes
 */
export const StatisticCards: React.FC<StatisticCardsProps> = ({
  siteSlug,
  metrics: propMetrics,
  showSearchMetrics = true,
  showInteractionMetrics = true,
  isLoading: propIsLoading,
  className = '',
}) => {
  // State for selected time period
  const [period, setPeriod] = useState<TimePeriod>('month');

  // Use the hook to fetch metrics if they're not provided as props
  const {
    metrics: hookMetrics,
    isLoading: hookIsLoading,
    error,
    fetchMetrics,
  } = useSiteMetrics({
    siteSlug: siteSlug || '',
    period,
    // Don't make the API call if metrics are provided via props
    ...(!propMetrics && siteSlug ? {} : { siteSlug: '' }),
  });

  // Use provided metrics if available, otherwise use those from the hook
  const metrics = propMetrics || hookMetrics;
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  // Handle period change
  const handlePeriodChange = (newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
  };

  // Format numbers with thousands separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div data-testid="statistics-section">
      {/* Period selector */}
      <div className="flex justify-end mb-4">
        <PeriodSelector
          period={period}
          onChange={handlePeriodChange}
        />
      </div>

      {/* Statistics grid */}
      <StatisticsContainer className={className} isLoading={isLoading}>
        {/* Display error if there is one */}
        {error && (
          <MetricsError
            message={error.message}
            onRetry={fetchMetrics}
          />
        )}

        {/* Listings Card */}
        <StatisticCard
          title="Total Listings"
          value={isLoading ? '-' : formatNumber(metrics?.listings.total || 0)}
          change={
            !isLoading && metrics?.listings.change
              ? {
                  value: metrics.listings.change.total,
                  isPositive: metrics.listings.change.isPositive,
                }
              : undefined
          }
          icon={<ListingIcon />}
          isLoading={isLoading}
          subtitle={`Period: ${period}`}
          onRefresh={fetchMetrics}
        />

        {/* Categories Card */}
        <StatisticCard
          title="Active Categories"
          value={isLoading ? '-' : formatNumber(metrics?.categories.active || 0)}
          change={
            !isLoading && metrics?.categories.change
              ? {
                  value: metrics.categories.change.total,
                  isPositive: metrics.categories.change.isPositive,
                }
              : undefined
          }
          icon={<CategoryIcon />}
          isLoading={isLoading}
          subtitle={`Period: ${period}`}
          onRefresh={fetchMetrics}
        />

        {/* Visitors Card */}
        <StatisticCard
          title="Unique Visitors"
          value={isLoading ? '-' : formatNumber(metrics?.traffic.uniqueVisitors || 0)}
          change={
            !isLoading && metrics?.traffic.change
              ? {
                  value: metrics.traffic.change.uniqueVisitors,
                  isPositive: metrics.traffic.change.isPositive,
                }
              : undefined
          }
          icon={<VisitorIcon />}
          isLoading={isLoading}
          subtitle={`Period: ${period}`}
          onRefresh={fetchMetrics}
        />

        {/* Page Views Card */}
        <StatisticCard
          title="Page Views"
          value={isLoading ? '-' : formatNumber(metrics?.traffic.pageViews || 0)}
          change={
            !isLoading && metrics?.traffic.change
              ? {
                  value: metrics.traffic.change.pageViews,
                  isPositive: metrics.traffic.change.isPositive,
                }
              : undefined
          }
          icon={<VisitorIcon />}
          isLoading={isLoading}
          subtitle={`Period: ${period}`}
          onRefresh={fetchMetrics}
        />

        {/* Conditional Search Metrics */}
        {showSearchMetrics && (
          <StatisticCard
            title="Total Searches"
            value={isLoading ? '-' : formatNumber(metrics?.search.totalSearches || 0)}
            change={
              !isLoading && metrics?.search.change
                ? {
                    value: metrics.search.change.searches,
                    isPositive: metrics.search.change.isPositive,
                  }
                : undefined
            }
            icon={<SearchIcon />}
            isLoading={isLoading}
            subtitle={`Period: ${period}`}
            onRefresh={fetchMetrics}
          />
        )}

        {/* Conditional Interaction Metrics */}
        {showInteractionMetrics && (
          <StatisticCard
            title="Interactions"
            value={isLoading ? '-' : formatNumber(metrics?.interactions.clicks || 0)}
            change={
              !isLoading && metrics?.interactions.change
                ? {
                    value: metrics.interactions.change.total,
                    isPositive: metrics.interactions.change.isPositive,
                  }
                : undefined
            }
            icon={<InteractionIcon />}
            isLoading={isLoading}
            subtitle={`Period: ${period}`}
            onRefresh={fetchMetrics}
          />
        )}
      </StatisticsContainer>
    </div>
  );
};

// Also export as default for backward compatibility
export default StatisticCards;