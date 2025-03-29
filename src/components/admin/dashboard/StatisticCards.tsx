'use client';

import React from 'react';
import { useSiteMetrics } from './hooks';
import { StatisticCardsProps, StatisticCardProps } from './types';
import StatisticCard from './components/StatisticCard';

// Icons (in a real implementation, these would be imported from a proper icon library)
const ListingIcon = () => (
  <svg data-testid="listing-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CategoryIcon = () => (
  <svg data-testid="category-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const VisitorIcon = () => (
  <svg data-testid="visitor-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const SearchIcon = () => (
  <svg data-testid="search-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const InteractionIcon = () => (
  <svg data-testid="interaction-icon" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
  </svg>
);

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
const StatisticCards: React.FC<StatisticCardsProps> = ({
  siteSlug,
  metrics: propMetrics,
  showSearchMetrics = true,
  showInteractionMetrics = true,
  isLoading: propIsLoading,
  className = '',
}) => {
  // Use the hook to fetch metrics if they're not provided as props
  const {
    metrics: hookMetrics,
    isLoading: hookIsLoading,
    error,
  } = useSiteMetrics({
    siteSlug: siteSlug || '',
    // Don't make the API call if metrics are provided via props
    ...(!propMetrics && siteSlug ? {} : { siteSlug: '' }),
  });

  // Use provided metrics if available, otherwise use those from the hook
  const metrics = propMetrics || hookMetrics;
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  // Format numbers with thousands separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div
      data-testid="statistic-cards"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}
      aria-label="Site statistics"
    >
      {/* Display error if there is one */}
      {error && (
        <div 
          className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
          data-testid="metrics-error"
        >
          <p>Failed to load metrics: {error.message}</p>
          <button 
            className="text-red-600 underline mt-2" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
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
        />
      )}
    </div>
  );
};

export default StatisticCards;
