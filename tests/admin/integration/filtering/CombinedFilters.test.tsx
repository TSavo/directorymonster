import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTable } from '../../../../src/components/admin/listings/ListingTable';
import { ListingFilterBar } from '../../../../src/components/admin/listings/components/table/ListingFilterBar';
import { CategoryFilterTree } from '../../../../src/components/admin/listings/components/table/CategoryFilterTree';
import { SiteFilterDropdown } from '../../../../src/components/admin/listings/components/SiteFilterDropdown';
import { StatusFilter } from '../../../../src/components/admin/listings/components/StatusFilter';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
  { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
];

const mockSites = [
  { id: 'site1', name: 'Test Site 1', domain: 'test1.com' },
  { id: 'site2', name: 'Test Site 2', domain: 'test2.com' },
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'], siteId: 'site1', status: 'published' },
  { id: 'listing2', title: 'Listing 2', categoryIds: ['cat2'], siteId: 'site1', status: 'draft' },
  { id: 'listing3', title: 'Listing 3', categoryIds: ['cat1'], siteId: 'site2', status: 'published' },
  { id: 'listing4', title: 'Listing 4', categoryIds: ['cat2'], siteId: 'site2', status: 'archived' },
  { id: 'listing5', title: 'Listing 5', categoryIds: ['cat1', 'cat2'], siteId: 'site1', status: 'published' },
];

// Mock the hooks implementation
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useCategories } from '../../../../src/components/admin/categories/hooks/useCategories';
import { useSites } from '../../../../src/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Combined Filtering (Category + Site + Status)', () => {
  let store;
  
  beforeEach(() => {
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterByCategory: jest.fn((categoryId) => {
        return mockListings.filter(listing => 
          listing.categoryIds && listing.categoryIds.includes(categoryId)
        );
      }),
      filterBySite: jest.fn((siteId) => {
        return mockListings.filter(listing => listing.siteId === siteId);
      }),
      filterByStatus: jest.fn((status) => {
        return mockListings.filter(listing => listing.status === status);
      }),
      filterByCombination: jest.fn((filters) => {
        return mockListings.filter(listing => {
          const categoryMatch = !filters.categoryId || 
            (listing.categoryIds && listing.categoryIds.includes(filters.categoryId));
          const siteMatch = !filters.siteId || listing.siteId === filters.siteId;
          const statusMatch = !filters.status || listing.status === filters.status;
          return categoryMatch && siteMatch && statusMatch;
        });
      }),
      clearFilters: jest.fn(),
      activeFilters: {},
    });
    
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => mockCategories.find(cat => cat.id === id)),
    });
    
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: mockListings,
        loading: false,
        error: null,
        filters: {
          categoryId: null,
          siteId: null,
          status: null,
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
  });

  it('should apply multiple filters simultaneously', async () => {
    const { filterByCombination } = useListings();
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
          <SiteFilterDropdown />
          <StatusFilter />
        </ListingFilterBar>
        <ListingTable />
      </Provider>
    );

    // Check that all listings are initially visible
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
    expect(screen.getByText('Listing 3')).toBeInTheDocument();
    expect(screen.getByText('Listing 4')).toBeInTheDocument();
    expect(screen.getByText('Listing 5')).toBeInTheDocument();

    // Apply category filter
    fireEvent.click(screen.getByTestId('category-filter-cat1'));
    
    // Apply site filter
    fireEvent.click(screen.getByTestId('site-filter-dropdown'));
    fireEvent.click(screen.getByText('Test Site 1'));
    
    // Apply status filter
    fireEvent.click(screen.getByTestId('status-filter-dropdown'));
    fireEvent.click(screen.getByText('Published'));
    
    // Check that filterByCombination was called with all filters
    expect(filterByCombination).toHaveBeenCalledWith({
      categoryId: 'cat1',
      siteId: 'site1',
      status: 'published',
    });
    
    // Update the mock to simulate combined filtered results
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        listing.categoryIds.includes('cat1') && 
        listing.siteId === 'site1' && 
        listing.status === 'published'
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination,
      clearFilters: jest.fn(),
      activeFilters: {
        categoryId: 'cat1',
        siteId: 'site1',
        status: 'published',
      },
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that only listings matching all filters are visible
      expect(screen.getByText('Listing 1')).toBeInTheDocument(); // Category 1, Site 1, Published
      expect(screen.queryByText('Listing 2')).not.toBeInTheDocument(); // Category 2, Site 1, Draft
      expect(screen.queryByText('Listing 3')).not.toBeInTheDocument(); // Category 1, Site 2, Published
      expect(screen.queryByText('Listing 4')).not.toBeInTheDocument(); // Category 2, Site 2, Archived
      expect(screen.getByText('Listing 5')).toBeInTheDocument(); // Category 1 & 2, Site 1, Published
    });
  });

  it('should display all active filters in the UI', async () => {
    // Mock the store with active filters
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && 
          listing.categoryIds.includes('cat1') && 
          listing.siteId === 'site1' && 
          listing.status === 'published'
        ),
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat1',
          siteId: 'site1',
          status: 'published',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        listing.categoryIds.includes('cat1') && 
        listing.siteId === 'site1' && 
        listing.status === 'published'
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination: jest.fn(),
      clearFilters: jest.fn(),
      activeFilters: {
        categoryId: 'cat1',
        siteId: 'site1',
        status: 'published',
      },
    });
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
          <SiteFilterDropdown />
          <StatusFilter />
        </ListingFilterBar>
      </Provider>
    );
    
    // Check that all active filters are displayed
    expect(screen.getByTestId('active-category-filter')).toHaveTextContent('Category 1');
    expect(screen.getByTestId('active-site-filter')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('active-status-filter')).toHaveTextContent('Published');
  });

  it('should update results when removing one filter while keeping others', async () => {
    const { filterByCombination, clearFilters } = useListings();
    
    // Start with all filters active
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        listing.categoryIds.includes('cat1') && 
        listing.siteId === 'site1' && 
        listing.status === 'published'
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination,
      clearFilters,
      activeFilters: {
        categoryId: 'cat1',
        siteId: 'site1',
        status: 'published',
      },
    });
    
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && 
          listing.categoryIds.includes('cat1') && 
          listing.siteId === 'site1' && 
          listing.status === 'published'
        ),
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat1',
          siteId: 'site1',
          status: 'published',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
          <SiteFilterDropdown />
          <StatusFilter />
        </ListingFilterBar>
        <ListingTable />
      </Provider>
    );
    
    // Clear just the category filter
    fireEvent.click(screen.getByTestId('clear-category-filter'));
    
    // Check that filterByCombination was called with updated filters
    expect(filterByCombination).toHaveBeenCalledWith({
      categoryId: null,
      siteId: 'site1',
      status: 'published',
    });
    
    // Update the mock to simulate the new filter combination
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.siteId === 'site1' && 
        listing.status === 'published'
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination,
      clearFilters,
      activeFilters: {
        categoryId: null,
        siteId: 'site1',
        status: 'published',
      },
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that listings match the remaining filters (site1 + published)
      expect(screen.getByText('Listing 1')).toBeInTheDocument(); // Site 1, Published
      expect(screen.queryByText('Listing 2')).not.toBeInTheDocument(); // Site 1, Draft
      expect(screen.queryByText('Listing 3')).not.toBeInTheDocument(); // Site 2, Published
      expect(screen.queryByText('Listing 4')).not.toBeInTheDocument(); // Site 2, Archived
      expect(screen.getByText('Listing 5')).toBeInTheDocument(); // Site 1, Published
    });
  });

  it('should clear all filters when the clear all button is clicked', async () => {
    const { clearFilters } = useListings();
    
    // Start with all filters active
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        listing.categoryIds.includes('cat1') && 
        listing.siteId === 'site1' && 
        listing.status === 'published'
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination: jest.fn(),
      clearFilters,
      activeFilters: {
        categoryId: 'cat1',
        siteId: 'site1',
        status: 'published',
      },
    });
    
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && 
          listing.categoryIds.includes('cat1') && 
          listing.siteId === 'site1' && 
          listing.status === 'published'
        ),
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat1',
          siteId: 'site1',
          status: 'published',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
          <SiteFilterDropdown />
          <StatusFilter />
          <button data-testid="clear-all-filters">Clear All Filters</button>
        </ListingFilterBar>
      </Provider>
    );
    
    // Click the clear all filters button
    fireEvent.click(screen.getByTestId('clear-all-filters'));
    
    // Check that clearFilters was called
    expect(clearFilters).toHaveBeenCalled();
    
    // Update the mock to simulate cleared filters
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination: jest.fn(),
      clearFilters,
      activeFilters: {
        categoryId: null,
        siteId: null,
        status: null,
      },
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that all listings are visible again
      expect(screen.getByText('Listing 1')).toBeInTheDocument();
      expect(screen.getByText('Listing 2')).toBeInTheDocument();
      expect(screen.getByText('Listing 3')).toBeInTheDocument();
      expect(screen.getByText('Listing 4')).toBeInTheDocument();
      expect(screen.getByText('Listing 5')).toBeInTheDocument();
    });
  });

  it('should handle the case when there are no listings matching the combined filters', async () => {
    // Use a combination of filters that no listing matches
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      filterBySite: jest.fn(),
      filterByStatus: jest.fn(),
      filterByCombination: jest.fn(),
      clearFilters: jest.fn(),
      activeFilters: {
        categoryId: 'cat2',
        siteId: 'site2',
        status: 'draft', // No listing matches this combination
      },
    });
    
    store = mockStore({
      listings: {
        items: [],
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat2',
          siteId: 'site2',
          status: 'draft',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Check that the empty state message is displayed
    expect(screen.getByTestId('empty-listings-message')).toBeInTheDocument();
    expect(screen.getByTestId('empty-listings-message')).toHaveTextContent('No listings match your filter criteria');
  });
});
