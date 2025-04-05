import { Listing, ListingStatus, ListingSortField, SortDirection } from '../../../../src/components/admin/listings/types';

// Mock the useListings hook
export const mockUseListings = {
  listings: [],
  loading: false,
  error: null,
  filters: {},
  sort: { field: 'updatedAt' as ListingSortField, direction: 'desc' as SortDirection },
  pagination: { page: 1, perPage: 10, total: 0, totalPages: 1 },
  selected: [],
  activeFilters: {},
  setSearchTerm: jest.fn(),
  setStatusFilter: jest.fn(),
  setCategoryFilter: jest.fn(),
  setFeaturedFilter: jest.fn(),
  resetFilters: jest.fn(),
  setSorting: jest.fn(),
  setPage: jest.fn(),
  setPerPage: jest.fn(),
  toggleSelection: jest.fn(),
  selectAll: jest.fn(),
  clearSelection: jest.fn(),
  deleteListing: jest.fn(),
  deleteSelected: jest.fn(),
  fetchListings: jest.fn(),
  filterByCategory: jest.fn(),
  filterBySite: jest.fn(),
  filterByStatus: jest.fn(),
  filterByCombination: jest.fn(),
  clearCategoryFilter: jest.fn(),
  clearSiteFilter: jest.fn(),
  clearFilters: jest.fn(),
  resetAllFilters: jest.fn(),
  saveFiltersToSessionStorage: jest.fn(),
  loadFiltersFromSessionStorage: jest.fn(),
  retryFetch: jest.fn()
};

// Create a function to generate a mock with custom values
export const createMockUseListings = (overrides = {}) => {
  return {
    ...mockUseListings,
    ...overrides
  };
};

export default createMockUseListings;
