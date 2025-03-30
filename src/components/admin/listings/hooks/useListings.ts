"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Listing, 
  ListingFilters, 
  ListingSortField, 
  SortDirection, 
  ListingPagination, 
  ListingApiResponse,
  ListingStatus 
} from '../types';

interface UseListingsProps {
  siteSlug?: string;
  initialFilters?: ListingFilters;
  initialSort?: {
    field: ListingSortField;
    direction: SortDirection;
  };
  initialPagination?: {
    page: number;
    perPage: number;
  };
}

/**
 * Hook for fetching and managing listings data
 */
export const useListings = ({
  siteSlug,
  initialFilters = {},
  initialSort = { field: 'updatedAt', direction: 'desc' },
  initialPagination = { page: 1, perPage: 10 }
}: UseListingsProps = {}) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [sort, setSort] = useState<{
    field: ListingSortField;
    direction: SortDirection;
  }>(initialSort);
  const [pagination, setPagination] = useState<ListingPagination>({
    page: initialPagination.page,
    perPage: initialPagination.perPage,
    total: 0,
    totalPages: 0
  });
  const [selected, setSelected] = useState<string[]>([]);

  /**
   * Fetch listings from the API
   */
  const fetchListings = useCallback(async () => {
    if (!siteSlug) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination params
      queryParams.append('page', pagination.page.toString());
      queryParams.append('perPage', pagination.perPage.toString());
      
      // Add sort params
      queryParams.append('sortField', sort.field);
      queryParams.append('sortDirection', sort.direction);
      
      // Add filter params
      if (filters.search) {
        queryParams.append('search', filters.search);
      }
      
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => {
          queryParams.append('status', status);
        });
      }
      
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        filters.categoryIds.forEach(categoryId => {
          queryParams.append('categoryId', categoryId);
        });
      }
      
      if (filters.featured !== undefined) {
        queryParams.append('featured', filters.featured.toString());
      }
      
      if (filters.fromDate) {
        queryParams.append('fromDate', filters.fromDate);
      }
      
      if (filters.toDate) {
        queryParams.append('toDate', filters.toDate);
      }
      
      if (filters.userId) {
        queryParams.append('userId', filters.userId);
      }

      const response = await fetch(`/api/sites/${siteSlug}/listings?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch listings: ${response.statusText}`);
      }
      
      const data: ListingApiResponse = await response.json();
      
      setListings(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [siteSlug, filters, sort, pagination.page, pagination.perPage]);

  /**
   * Fetch listings on initial load and when dependencies change
   */
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  /**
   * Set search filter
   */
  const setSearchTerm = useCallback((search: string) => {
    setFilters