'use client';

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
  initialListings?: Listing[];  // Make sure this is included in the interface
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
  initialListings = [],  // Default to empty array
  initialFilters = {},
  initialSort = { field: 'updatedAt', direction: 'desc' },
  initialPagination = { page: 1, perPage: 10 }
}: UseListingsProps = {}) => {
  // Initialize with initialListings if provided, otherwise empty array
  const [listings, setListings] = useState<Listing[]>(initialListings || []);
  
  // Set loading to false if initialListings is provided with items
  const [loading, setLoading] = useState(initialListings?.length ? false : true);
  
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>(initialFilters || {});
  const [sort, setSort] = useState<{
    field: ListingSortField;
    direction: SortDirection;
  }>(initialSort || { field: 'updatedAt', direction: 'desc' });
  const [pagination, setPagination] = useState<ListingPagination>({
    page: initialPagination?.page || 1,
    perPage: initialPagination?.perPage || 10,
    total: initialListings?.length || 0,
    totalPages: Math.ceil((initialListings?.length || 0) / (initialPagination?.perPage || 10))
  });
  const [selected, setSelected] = useState<string[]>([]);
  
  // Used to track active filters for UI components
  const [activeFilters, setActiveFilters] = useState<{
    categoryId?: string | null;
    siteId?: string | null;
    status?: ListingStatus[] | null;
  }>({});

  /**
   * React to changes in initialListings prop
   */
  useEffect(() => {
    if (initialListings?.length) {
      setListings(initialListings);
      setLoading(false);
      setPagination(prev => ({
        ...prev,
        total: initialListings.length,
        totalPages: Math.ceil(initialListings.length / prev.perPage)
      }));
    }
  }, [initialListings]);

  /**
   * Fetch listings from the API
   */
  const fetchListings = useCallback(async () => {
    // If initialListings is provided, skip API call in tests
    if (initialListings?.length) {
      setListings(initialListings);
      setLoading(false);
      return;
    }
    
    // Only fetch from API if siteSlug is provided
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

      if (filters.siteId) {
        queryParams.append('siteId', filters.siteId);
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
  }, [siteSlug, filters, sort, pagination.page, pagination.perPage, initialListings]);

  /**
   * Fetch listings on initial load and when dependencies change
   */
  useEffect(() => {
    // Skip initial API fetch if initialListings is provided
    if (initialListings?.length) {
      return;
    }
    
    fetchListings();
  }, [fetchListings, initialListings]);

  // Rest of the hook implementation remains the same...
  // ... (all the other functions)

  return {
    listings,
    loading,
    error,
    filters,
    sort,
    pagination,
    selected,
    activeFilters,
    setSearchTerm: /* implementation */,
    setStatusFilter: /* implementation */,
    setCategoryFilter: /* implementation */,
    setFeaturedFilter: /* implementation */,
    resetFilters: /* implementation */,
    setSorting: /* implementation */,
    setPage: /* implementation */,
    setPerPage: /* implementation */,
    toggleSelection: /* implementation */,
    selectAll: /* implementation */,
    clearSelection: /* implementation */,
    deleteListing: /* implementation */,
    deleteSelected: /* implementation */,
    fetchListings,
    filterByCategory: /* implementation */,
    filterBySite: /* implementation */,
    filterByStatus: /* implementation */,
    filterByCombination: /* implementation */,
    clearCategoryFilter: /* implementation */,
    clearSiteFilter: /* implementation */,
    clearFilters: /* implementation */,
    resetAllFilters: /* implementation */,
    saveFiltersToSessionStorage: /* implementation */,
    loadFiltersFromSessionStorage: /* implementation */
  };
};
