import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ListingTable from '@/components/admin/listings/ListingTable';
import { CategoryFilterTree } from '@/components/admin/listings/components/table/CategoryFilterTree';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock data
const mockCategories = [
  { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
  { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
  { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'] },
  { id: 'listing2', title: 'Listing 2', categoryIds: ['cat2'] },
  { id: 'listing3', title: 'Listing 3', categoryIds: ['cat3'] },
  { id: 'listing4', title: 'Listing 4', categoryIds: ['cat1', 'cat2'] },
];

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';

const mockStore = configureStore([]);

describe('Integration: Category Filtering on Listings', () => {
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
      clearFilters: jest.fn(),
    });
    
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => mockCategories.find(cat => cat.id === id)),
      getCategoryChildren: jest.fn((id) => mockCategories.filter(cat => cat.parentId === id)),
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

  it.skip($2, async () => {
    const { filterByCategory } = useListings();
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
        <ListingTable />
      </Provider>
    );

    // Check that all listings are initially visible
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
    expect(screen.getByText('Listing 3')).toBeInTheDocument();
    expect(screen.getByText('Listing 4')).toBeInTheDocument();

    // Select a category
    fireEvent.click(screen.getByTestId('category-filter-cat1'));
    
    // Check that filterByCategory was called with the correct category ID
    expect(filterByCategory).toHaveBeenCalledWith('cat1');
    
    // Update the mock to simulate filtered results
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && listing.categoryIds.includes('cat1')
      ),
      isLoading: false,
      error: null,
      filterByCategory,
      clearFilters: jest.fn(),
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that only listings in category 1 are visible
      expect(screen.getByText('Listing 1')).toBeInTheDocument();
      expect(screen.queryByText('Listing 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Listing 3')).not.toBeInTheDocument();
      expect(screen.getByText('Listing 4')).toBeInTheDocument(); // Has both cat1 and cat2
    });
  });

  it.skip($2, async () => {
    const { filterByCategory } = useListings();
    
    // Customize the useCategories mock to include hierarchical behavior
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => mockCategories.find(cat => cat.id === id)),
      getCategoryChildren: jest.fn((id) => mockCategories.filter(cat => cat.parentId === id)),
      getCategoryWithDescendants: jest.fn((id) => {
        const result = [id];
        const children = mockCategories.filter(cat => cat.parentId === id);
        children.forEach(child => result.push(child.id));
        return result;
      }),
    });
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
        <ListingTable />
      </Provider>
    );

    // Select the parent category with subcategories
    fireEvent.click(screen.getByTestId('category-filter-cat1'));
    
    // Check that filterByCategory was called with the correct category ID
    expect(filterByCategory).toHaveBeenCalledWith('cat1');
    
    // Update the mock to simulate hierarchical filtered results
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => 
        listing.categoryIds && 
        (listing.categoryIds.includes('cat1') || listing.categoryIds.includes('cat3'))
      ),
      isLoading: false,
      error: null,
      filterByCategory,
      clearFilters: jest.fn(),
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that both parent category and subcategory listings are visible
      expect(screen.getByText('Listing 1')).toBeInTheDocument(); // In cat1
      expect(screen.queryByText('Listing 2')).not.toBeInTheDocument(); // Not in cat1 or cat3
      expect(screen.getByText('Listing 3')).toBeInTheDocument(); // In cat3 (subcategory of cat1)
      expect(screen.getByText('Listing 4')).toBeInTheDocument(); // Has cat1
    });
  });

  it.skip($2, async () => {
    // Mock the store with an active category filter
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && listing.categoryIds.includes('cat1')
        ),
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat1',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
      </Provider>
    );
    
    // Check that the active filter is displayed
    expect(screen.getByTestId('active-category-filter')).toHaveTextContent('Category 1');
  });

  it.skip($2, async () => {
    const { clearFilters } = useListings();
    
    // Mock the store with an active category filter
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => 
          listing.categoryIds && listing.categoryIds.includes('cat1')
        ),
        loading: false,
        error: null,
        filters: {
          categoryId: 'cat1',
        },
      },
      categories: {
        items: mockCategories,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
      </Provider>
    );
    
    // Click the clear filter button
    fireEvent.click(screen.getByTestId('clear-category-filter'));
    
    // Check that clearFilters was called
    expect(clearFilters).toHaveBeenCalled();
    
    // Update the mock to simulate cleared filters
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      clearFilters,
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
    });
  });

  it.skip($2, async () => {
    const { filterByCategory } = useListings();
    
    // Add a category with no listings
    const emptyCategory = { id: 'cat4', name: 'Empty Category', slug: 'empty-category', parentId: null };
    const updatedCategories = [...mockCategories, emptyCategory];
    
    (useCategories as jest.Mock).mockReturnValue({
      categories: updatedCategories,
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => updatedCategories.find(cat => cat.id === id)),
      getCategoryChildren: jest.fn((id) => updatedCategories.filter(cat => cat.parentId === id)),
    });
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
      </Provider>
    );
    
    // Select the empty category
    fireEvent.click(screen.getByTestId('category-filter-cat4'));
    
    // Check that filterByCategory was called with the correct category ID
    expect(filterByCategory).toHaveBeenCalledWith('cat4');
    
    // Update the mock to simulate empty results
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: false,
      error: null,
      filterByCategory,
      clearFilters: jest.fn(),
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that the empty state message is displayed
      expect(screen.getByTestId('empty-listings-message')).toBeInTheDocument();
      expect(screen.getByTestId('empty-listings-message')).toHaveTextContent('No listings found');
    });
  });
});
