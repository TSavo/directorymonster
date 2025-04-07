'use client';

import { useState, useEffect } from 'react';
import { UseSiteMetricsParams, UseSiteMetricsResult, SiteMetricsData } from '../types';

// This mock data will be replaced with actual API calls in production
const getMockSiteMetricsData = (siteSlug: string): SiteMetricsData => {
  return {
    id: '123',
    siteId: siteSlug,
    listings: {
      total: 250,
      published: 210,
      draft: 40,
      featured: 15,
      change: {
        total: 12,
        isPositive: true,
      },
    },
    categories: {
      total: 35,
      active: 30,
      change: {
        total: 3,
        isPositive: true,
      },
    },
    traffic: {
      pageViews: 15200,
      uniqueVisitors: 5400,
      averageTimeOnSite: 185, // seconds
      bounceRate: 42.5, // percentage
      change: {
        pageViews: 1200,
        uniqueVisitors: 450,
        isPositive: true,
      },
    },
    search: {
      totalSearches: 2340,
      avgSearchesPerVisitor: 0.43,
      topSearchTerms: [
        { term: 'camping gear', count: 145 },
        { term: 'tents', count: 123 },
        { term: 'sleeping bags', count: 98 },
        { term: 'hiking boots', count: 87 },
        { term: 'backpacks', count: 76 },
      ],
      change: {
        searches: 210,
        isPositive: true,
      },
    },
    interactions: {
      clicks: 3200,
      shares: 420,
      saves: 890,
      change: {
        total: 180,
        isPositive: true,
      },
    },
  };
};

/**
 * Hook to fetch and manage site metrics data
 */
export const useSiteMetrics = ({
  siteSlug,
  period = 'week',
  startDate,
  endDate,
}: UseSiteMetricsParams): UseSiteMetricsResult => {
  const [metrics, setMetrics] = useState<SiteMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = async () => {
    if (!siteSlug) {
      setError(new Error('Site slug is required'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/sites/${siteSlug}/metrics?period=${period}`);
      // const data = await response.json();

      // Using mock data for now
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const data = getMockSiteMetricsData(siteSlug);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch site metrics'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [siteSlug, period, startDate, endDate]);

  return {
    metrics,
    isLoading,
    error,
    fetchMetrics,
  };
};

export default useSiteMetrics;
