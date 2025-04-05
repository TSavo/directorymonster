"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
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
  initialListings?: Listing[];  // Add initialListings property
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
  const router = useRouter();
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
   * Fetch listings when component mounts or when dependencies change
   */
  useEffect(() => {
    // Skip if we already have initialListings
    if (!initialListings?.length) {
      fetchListings();
    }
  }, [fetchListings, initialListings, siteSlug, filters, sort, pagination.page, pagination.perPage]);

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
    setActiveFilters(prev => ({ ...prev, status: status.length > 0 ? status : null }));
  }, []);

  /**
   * Set category filter
   */
  const setCategoryFilter = useCallback((categoryIds: string[]) => {
    setFilters(prev => ({ ...prev, categoryIds }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setActiveFilters(prev => ({
      ...prev,
      categoryId: categoryIds.length > 0 ? categoryIds[0] : null
    }));
  }, []);

  /**
   * Filter by a specific category
   */
  const filterByCategory = useCallback((categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: categoryId ? [categoryId] : []
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setActiveFilters(prev => ({ ...prev, categoryId }));

    // Update URL with category filter
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, category: categoryId },
      },
      undefined,
      { shallow: true }
    );
  }, [router]);

  /**
   * Filter by a specific site
   */
  const filterBySite = useCallback((siteId: string) => {
    setFilters(prev => ({ ...prev, siteId }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setActiveFilters(prev => ({ ...prev, siteId }));
  }, []);

  /**
   * Filter by status
   */
  const filterByStatus = useCallback((status: ListingStatus) => {
    setFilters(prev => ({
      ...prev,
      status: status ? [status] : []
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setActiveFilters(prev => ({ ...prev, status: status ? [status] : null }));
  }, []);

  /**
   * Filter by a combination of filters
   */
  const filterByCombination = useCallback((filters: any) => {
    // For testing purposes, we'll log the filters
    console.log('Filtering by combination:', filters);

    // Handle both ListingFilters and ActiveFilters formats
    if ('categoryIds' in filters) {
      // ListingFilters format
      setFilters(filters);
      setPagination(prev => ({ ...prev, page: 1 }));
      setActiveFilters({
        categoryId: filters.categoryIds?.length ? filters.categoryIds[0] : null,
        siteId: filters.siteId || null,
        status: filters.status || null
      });
    } else {
      // ActiveFilters format (from tests)
      setActiveFilters(filters);
      setFilters({
        categoryIds: filters.categoryId ? [filters.categoryId] : [],
        siteId: filters.siteId || null,
        status: filters.status || null
      });
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, []);

  /**
   * Clear category filter
   */
  const clearCategoryFilter = useCallback(() => {
    setFilters(prev => {
      const { categoryIds, ...rest } = prev;
      return rest;
    });
    setActiveFilters(prev => ({ ...prev, categoryId: null }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clear site filter
   */
  const clearSiteFilter = useCallback(() => {
    setFilters(prev => {
      const { siteId, ...rest } = prev;
      return rest;
    });
    setActiveFilters(prev => ({ ...prev, siteId: null }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    setActiveFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Reset all filters (alias for clearFilters)
   */
  const resetAllFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

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
    setActiveFilters({});
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

  /**
   * Save filters to session storage
   */
  const saveFiltersToSessionStorage = useCallback(() => {
    try {
      sessionStorage.setItem('listingFilters', JSON.stringify(filters));
      sessionStorage.setItem('listingSorting', JSON.stringify(sort));
      sessionStorage.setItem('listingPagination', JSON.stringify({
        page: pagination.page,
        perPage: pagination.perPage
      }));
    } catch (error) {
      console.error('Error saving filters to session storage:', error);
    }
  }, [filters, sort, pagination.page, pagination.perPage]);

  /**
   * Load filters from session storage
   */
  const loadFiltersFromSessionStorage = useCallback(() => {
    try {
      const savedFilters = sessionStorage.getItem('listingFilters');
      const savedSorting = sessionStorage.getItem('listingSorting');
      const savedPagination = sessionStorage.getItem('listingPagination');

      if (savedFilters) {
        setFilters(JSON.parse(savedFilters));
      }

      if (savedSorting) {
        setSort(JSON.parse(savedSorting));
      }

      if (savedPagination) {
        const { page, perPage } = JSON.parse(savedPagination);
        setPagination(prev => ({ ...prev, page, perPage }));
      }

      return savedFilters ? JSON.parse(savedFilters) : {};
    } catch (error) {
      console.error('Error loading filters from session storage:', error);
      return {};
    }
  }, []);

  return {
    listings,
    loading,
    error,
    filters,
    sort,
    pagination,
    selected,
    activeFilters,
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
    fetchListings,
    filterByCategory,
    filterBySite,
    filterByStatus,
    filterByCombination,
    clearCategoryFilter,
    clearSiteFilter,
    clearFilters,
    resetAllFilters,
    saveFiltersToSessionStorage,
    loadFiltersFromSessionStorage
  };
}