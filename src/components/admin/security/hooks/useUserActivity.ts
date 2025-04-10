'use client';

import { useState, useCallback, useEffect } from 'react';
import { fetchUserActivity } from '../../../../services/securityService';
import { UserActivity } from '../../../../types/security';

export interface UseUserActivityOptions {
  userId?: string;
  initialPageSize?: number;
  autoFetch?: boolean;
  fetchService?: typeof fetchUserActivity;
}

export interface UseUserActivityResult {
  activities: UserActivity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  searchTerm: string;
  startDate: Date | null;
  endDate: Date | null;
  actionType: string;
  setSearchTerm: (term: string) => void;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setActionType: (type: string) => void;
  handleSearch: () => void;
  handleApplyFilters: () => void;
  handleLoadMore: () => void;
  resetFilters: () => void;
}

export function useUserActivity({
  userId,
  initialPageSize = 10,
  autoFetch = true,
  fetchService = fetchUserActivity
}: UseUserActivityOptions = {}): UseUserActivityResult {
  // State for activity data
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [actionType, setActionType] = useState('');

  // State for current applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    actionType: ''
  });

  // Function to fetch activities
  const fetchActivities = useCallback(async (isLoadMore = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentPage = isLoadMore ? page : 1;

      const result = await fetchService({
        userId,
        page: currentPage,
        pageSize,
        searchTerm: appliedFilters.searchTerm,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        actionType: appliedFilters.actionType
      });

      if (isLoadMore) {
        setActivities(prev => [...prev, ...result.activities]);
      } else {
        setActivities(result.activities);
      }

      setHasMore(result.hasMore);

      if (isLoadMore) {
        setPage(currentPage + 1);
      } else {
        setPage(2); // Reset to page 2 for next load more
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching activities');
    } finally {
      setIsLoading(false);
    }
  }, [userId, page, pageSize, appliedFilters, fetchService]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [autoFetch, fetchActivities]);

  // Handle search
  const handleSearch = useCallback(() => {
    setAppliedFilters(prev => ({
      ...prev,
      searchTerm
    }));
  }, [searchTerm]);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters({
      searchTerm,
      startDate,
      endDate,
      actionType
    });
  }, [searchTerm, startDate, endDate, actionType]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStartDate(null);
    setEndDate(null);
    setActionType('');
    setAppliedFilters({
      searchTerm: '',
      startDate: null,
      endDate: null,
      actionType: ''
    });
  }, []);

  // Refetch when applied filters change
  useEffect(() => {
    if (autoFetch) {
      fetchActivities();
    }
  }, [autoFetch, appliedFilters, fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    searchTerm,
    startDate,
    endDate,
    actionType,
    setSearchTerm,
    setStartDate,
    setEndDate,
    setActionType,
    handleSearch,
    handleApplyFilters,
    handleLoadMore,
    resetFilters
  };
}
