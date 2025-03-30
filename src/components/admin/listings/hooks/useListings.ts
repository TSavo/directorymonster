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
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when search changes
  }, []);

  /**
   * Set status filter
   */
  const setStatusFilter = useCallback((status: ListingStatus[]) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Set category filter
   */
  const setCategoryFilter = useCallback((categoryIds: string[]) => {
    setFilters(prev => ({ ...prev, categoryIds }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Set featured filter
   */
  const setFeaturedFilter = useCallback((featured: boolean | undefined) => {
    setFilters(prev => ({ ...prev, featured }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Set sort field and direction
   */
  const setSorting = useCallback((field: ListingSortField, direction?: SortDirection) => {
    setSort(prev => {
      // If same field, toggle direction unless a specific direction is provided
      if (prev.field === field && !direction) {
        return {
          field,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      
      // Otherwise, set the new field and direction (default to 'asc')
      return {
        field,
        direction: direction || 'asc'
      };
    });
  }, []);

  /**
   * Set page number
   */
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  /**
   * Set number of items per page
   */
  const setPerPage = useCallback((perPage: number) => {
    setPagination(prev => ({ ...prev, perPage, page: 1 }));
  }, []);

  /**
   * Toggle selection of a listing
   */
  const toggleSelection = useCallback((id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  /**
   * Select all listings
   */
  const selectAll = useCallback(() => {
    if (selected.length === listings.length) {
      setSelected([]);
    } else {
      setSelected(listings.map(listing => listing.id));
    }
  }, [listings, selected.length]);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelected([]);
  }, []);

  /**
   * Delete a listing
   */
  const deleteListing = useCallback(async (id: string) => {
    if (!siteSlug) return false;
    
    try {
      const response = await fetch(`/api/sites/${siteSlug}/listings/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete listing: ${response.statusText}`);
      }
      
      // Remove from selected list if it was selected
      setSelected(prev => prev.filter(item => item !== id));
      
      // Refresh listings
      await fetchListings();
      
      return true;
    } catch (err) {
      console.error('Error deleting listing:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
      return false;
    }
  }, [siteSlug, fetchListings]);

  /**
   * Delete multiple listings
   */
  const deleteSelected = useCallback(async () => {
    if (!siteSlug || selected.length === 0) return false;
    
    try {
      let success = true;
      
      for (const id of selected) {
        const response = await fetch(`/api/sites/${siteSlug}/listings/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          success = false;
        }
      }
      
      // Clear selected list
      setSelected([]);
      
      // Refresh listings
      await fetchListings();
      
      return success;
    } catch (err) {
      console.error('Error deleting listings:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete listings');
      return false;
    }
  }, [siteSlug, selected, fetchListings]);

  return {
    listings,
    loading,
    error,
    filters,
    sort,
    pagination,
    selected,
    setSearchTerm,
    setStatusFilter,
    setCategoryFilter,
    setFeaturedFilter,
    resetFilters,
    setSorting,
    setPage,
    setPerPage,
    toggleSelection,
    selectAll,
    clearSelection,
    deleteListing,
    deleteSelected,
    fetchListings
  };
}