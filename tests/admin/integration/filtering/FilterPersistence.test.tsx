import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTable } from '@/components/admin/listings/ListingTable';
import { ListingFilterBar } from '@/components/admin/listings/components/table/ListingFilterBar';
import { CategoryFilterTree } from '@/components/admin/listings/components/table/CategoryFilterTree';
import { AdminNavigation } from '@/components/admin/navigation/AdminNavigation';

// Mock the hooks and API calls
jest.mock('@/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
  { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'] },
  { id: 'listing2', title: 'Listing 2', categoryIds: ['cat2'] },
  { id: 'listing3', title: 'Listing 3', categoryIds: ['cat1'] },
];

// Mock the hooks implementation
import { useListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCategories';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Filter Persistence Between Navigation Events', () => {
  let store;
  
  beforeEach(() => {
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/listings',
      query: {},
      asPath: '/admin/listings',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });
    
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      saveFiltersToSessionStorage: jest.fn(),
      loadFiltersFromSessionStorage: jest.fn(),
      clearFilters: jest.fn(),
      activeFilters: {},
    });
    
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => mockCategories.find(cat => cat.id === id)),
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: mockListings,
        loading: false,
        error: null,
        filters: {
          categoryId: null,
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
    });
  });

  it('should save filters to session storage when applied', async () => {
    const { filterByCategory, saveFiltersToSessionStorage } = useListings();
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
        </ListingFilterBar>
      </Provider>
    );

    // Apply category filter
    fireEvent.click(screen.getByTestId('category-filter-cat1'));
    
    // Check that filters were saved to session storage
    expect(saveFiltersToSessionStorage).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'cat1',
    }));
  });

  it('should load filters from session storage when navigating back to listings', async () => {
    const { loadFiltersFromSessionStorage } = useListings();
    const { push } = useRouter();
    
    render(
      <Provider store={store}>
        <AdminNavigation />
      </Provider>
    );

    // Navigate away from listings
    fireEvent.click(screen.getByTestId('nav-link-sites'));
    expect(push).toHaveBeenCalledWith('/admin/sites');
    
    // Simulate returning to listings page
    (useRouter as jest.Mock).mockReturnValue({
      push,
      pathname: '/admin/listings',
      query: {},
      asPath: '/admin/listings',
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    });
    
    // Re-render the component
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Check that filters were loaded from session storage
    expect(loadFiltersFromSessionStorage).toHaveBeenCalled();
  });

  it('should display previously applied filters after navigation', async () => {
    // Mock that we have filters stored in session storage
    const storedFilters = {
      categoryId: 'cat1',
    };
    
    // Mock the loadFiltersFromSessionStorage implementation
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        listing.categoryIds.includes(storedFilters.categoryId)
      ),
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      saveFiltersToSessionStorage: jest.fn(),
      loadFiltersFromSessionStorage: jest.fn().mockReturnValue(storedFilters),
      clearFilters: jest.fn(),
      activeFilters: storedFilters,
    });
    
    // Mock the store state to include active filters
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && 
          listing.categoryIds.includes(storedFilters.categoryId)
        ),
        loading: false,
        error: null,
        filters: storedFilters,
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <ListingFilterBar>
          <CategoryFilterTree />
        </ListingFilterBar>
        <ListingTable />
      </Provider>
    );
    
    // Check that the active filters are displayed in the UI
    expect(screen.getByTestId('active-category-filter')).toHaveTextContent('Category 1');
    
    // Check that the filtered listings are displayed
    expect(screen.getByText('Listing 1')).toBeInTheDocument(); 
    expect(screen.queryByText('Listing 2')).not.toBeInTheDocument();
    expect(screen.getByText('Listing 3')).toBeInTheDocument();
  });
});
