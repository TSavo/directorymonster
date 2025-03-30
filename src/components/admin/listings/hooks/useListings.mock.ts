/**
 * Mock implementation of the useListings hook for testing
 */

import { Listing, ListingStatus, ListingSortField, SortDirection } from '../types';

interface MockUseListingsOptions {
  listings?: Listing[];
  isLoading?: boolean;
  error?: string | null;
  activeFilters?: {
    categoryId?: string | null;
    siteId?: string | null;
    status?: ListingStatus[] | null;
  };
}

export const createMockUseListings = (options: MockUseListingsOptions = {}) => {
  const {
    listings = [],
    isLoading = false,
    error = null,
    activeFilters = {}
  } = options;

  const filterBySite = jest.fn((siteId: string) => {
    return listings.filter(listing => listing.siteId === siteId);
  });

  const clearFilters = jest.fn();
  const clearSiteFilter = jest.fn();
  const setSearchTerm = jest.fn();
  const setSorting = jest.fn();
  const setPage = jest.fn();
  const setPerPage = jest.fn();
  const fetchListings = jest.fn();
  const resetFilters = jest.fn();
  const deleteListing = jest.fn();
  const deleteSelected = jest.fn();
  const toggleSelection = jest.fn();
  const selectAll = jest.fn();
  const clearSelection = jest.fn();
  const setStatusFilter = jest.fn();
  const setCategoryFilter = jest.fn();
  const setFeaturedFilter = jest.fn();

  return {
    // Data
    listings,
    filteredListings: listings, // Important for the ListingTable component
    loading: isLoading,
    isLoading,
    error,
    
    // Filters and state
    filters: {},
    activeFilters,
    selected: [],
    
    // Filter functions
    filterBySite,
    clearFilters,
    clearSiteFilter,
    setSearchTerm,
    
    // Sort functions
    sort: { field: 'updatedAt' as ListingSortField, direction: 'desc' as SortDirection },
    setSorting,
    
    // Pagination
    pagination: { page: 1, perPage: 10, total: listings.length, totalPages: 1 },
    setPage,
    setPerPage,
    
    // Data operations
    fetchListings,
    resetFilters,
    deleteListing,
    deleteSelected,
    
    // Selection
    toggleSelection,
    selectAll,
    clearSelection,
    
    // Additional filter functions
    setStatusFilter,
    setCategoryFilter,
    setFeaturedFilter,
    filterByCategory: jest.fn(),
    filterByStatus: jest.fn(),
    filterByCombination: jest.fn(),
    clearCategoryFilter: jest.fn(),
    resetAllFilters: jest.fn(),
    
    // Persistence
    saveFiltersToSessionStorage: jest.fn(),
    loadFiltersFromSessionStorage: jest.fn(),
    
    // Extra properties used by ListingTable
    currentListings: listings,
    categories: [],
    sites: [],
    searchTerm: '',
    categoryFilter: null,
    siteFilter: null,
    sortField: 'updatedAt' as ListingSortField,
    sortOrder: 'desc' as SortDirection,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    setItemsPerPage: jest.fn(),
    goToPage: jest.fn(),
    isDeleteModalOpen: false,
    listingToDelete: null,
    confirmDelete: jest.fn(),
    handleDelete: jest.fn(),
    cancelDelete: jest.fn(),
    handleSort: jest.fn()
  };
};

export default createMockUseListings;
