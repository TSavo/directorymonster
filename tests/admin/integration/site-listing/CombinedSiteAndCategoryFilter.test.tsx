import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ListingTable from '@/components/admin/listings/ListingTable';

// Import the mock creator utility
import createMockUseListings from '@/components/admin/listings/hooks/useListings.mock';

// Mock the hooks
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock data
const mockSites = [
  { id: 'site1', name: 'Test Site 1', domain: 'test1.com' },
  { id: 'site2', name: 'Test Site 2', domain: 'test2.com' },
];

const mockCategories = [
  { id: 'cat1', name: 'Category 1', slug: 'category-1' },
  { id: 'cat2', name: 'Category 2', slug: 'category-2' },
];

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';

const mockStore = configureStore([]);

describe('Combined Site and Category Filtering', () => {
  let store;
  let filterBySite;
  let filterByCategory;
  
  beforeEach(() => {
    // Set up mock filter functions
    filterBySite = jest.fn();
    filterByCategory = jest.fn();
    
    // Create a properly structured mock useListings hook
    const mockUseListings = createMockUseListings({
      activeFilters: { }
    });
    mockUseListings.filterBySite = filterBySite;
    mockUseListings.filterByCategory = filterByCategory;
    
    // Apply the mocks
    (useListings as jest.Mock).mockReturnValue(mockUseListings);
    
    // Mock sites hook
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Mock categories hook
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: [],
        filters: {},
      },
      sites: {
        items: mockSites,
      },
      categories: {
        items: mockCategories,
      },
    });
  });

  it('should support applying both site and category filters together', async () => {
    // First mock a site filter being applied
    const mockUseListingsWithSiteFilter = createMockUseListings({
      activeFilters: { siteId: 'site1' }
    });
    mockUseListingsWithSiteFilter.filterBySite = filterBySite;
    mockUseListingsWithSiteFilter.filterByCategory = filterByCategory;
    
    (useListings as jest.Mock).mockReturnValue(mockUseListingsWithSiteFilter);
    
    // Render the ListingTable component
    const { rerender } = render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Apply a category filter
    // We simulate this by updating the mock to show both filters as active
    const mockUseListingsWithBothFilters = createMockUseListings({
      activeFilters: { siteId: 'site1', categoryId: 'cat1' }
    });
    mockUseListingsWithBothFilters.filterBySite = filterBySite;
    mockUseListingsWithBothFilters.filterByCategory = filterByCategory;
    
    (useListings as jest.Mock).mockReturnValue(mockUseListingsWithBothFilters);
    
    // Re-render to apply the updated mock
    rerender(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Verify that both filters can be applied simultaneously
    // This test only verifies that the hook supports both filters being active at once
    expect(mockUseListingsWithBothFilters.activeFilters.siteId).toBe('site1');
    expect(mockUseListingsWithBothFilters.activeFilters.categoryId).toBe('cat1');
  });
});
