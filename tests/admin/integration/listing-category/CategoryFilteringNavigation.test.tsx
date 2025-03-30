import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTable } from '@/components/admin/listings/ListingTable';
import { CategoryFilterTree } from '@/components/admin/listings/components/table/CategoryFilterTree';

// Mock the hooks and API calls
jest.mock('@/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock next router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks implementation
import { useListings } from '@/hooks/useListings';
import { useCategories } from '@/hooks/useCategories';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Category Filtering and Navigation', () => {
  let store;
  
  beforeEach(() => {
    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      pathname: '/admin/listings',
      query: {},
      asPath: '/admin/listings',
    });
    
    // Mock listings hook
    (useListings as jest.Mock).mockReturnValue({
      listings: [
        { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'] },
        { id: 'listing2', title: 'Listing 2', categoryIds: ['cat2'] },
        { id: 'listing3', title: 'Listing 3', categoryIds: ['cat3'] },
      ],
      isLoading: false,
      error: null,
      filterByCategory: jest.fn(),
      clearFilters: jest.fn(),
      activeFilters: {},
    });
    
    // Mock categories hook
    (useCategories as jest.Mock).mockReturnValue({
      categories: [
        { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
        { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
        { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
      ],
      isLoading: false,
      error: null,
      getCategoryById: jest.fn((id) => {
        const categories = [
          { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
          { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
          { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
        ];
        return categories.find(cat => cat.id === id);
      }),
      getCategoryChildren: jest.fn((id) => {
        const categories = [
          { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
          { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
          { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
        ];
        return categories.filter(cat => cat.parentId === id);
      }),
      getCategoryPath: jest.fn((id) => {
        if (id === 'cat3') {
          return ['cat1', 'cat3'];
        }
        return [id];
      }),
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: [
          { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'] },
          { id: 'listing2', title: 'Listing 2', categoryIds: ['cat2'] },
          { id: 'listing3', title: 'Listing 3', categoryIds: ['cat3'] },
        ],
        loading: false,
        error: null,
        filters: {
          categoryId: null,
        },
      },
      categories: {
        items: [
          { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
          { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
          { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
        ],
        loading: false,
        error: null,
      },
    });
  });

  it('should update URL when navigating through category hierarchy', async () => {
    const { push } = useRouter();
    const { filterByCategory } = useListings();
    
    render(
      <Provider store={store}>
        <CategoryFilterTree />
        <ListingTable />
      </Provider>
    );

    // Verify categories are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    
    // Navigate to a parent category
    fireEvent.click(screen.getByTestId('category-filter-cat1'));
    
    // Verify filterByCategory was called
    expect(filterByCategory).toHaveBeenCalledWith('cat1');
    
    // Verify URL was updated
    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/listings',
        query: { category: 'cat1' },
      }),
      undefined,
      { shallow: true }
    );
    
    // Update listings to show only Category 1 listings
    (useListings as jest.Mock).mockReturnValue({
      listings: [
        { id: 'listing1', title: 'Listing 1', categoryIds: ['cat1'] },
        { id: 'listing3', title: 'Listing 3', categoryIds: ['cat3'] }, // Subcategory of cat1
      ],
      isLoading: false,
      error: null,
      filterByCategory,
      clearFilters: jest.fn(),
      activeFilters: {
        categoryId: 'cat1',
      },
    });
    
    // Re-render with filtered listings
    render(
      <Provider store={store}>
        <CategoryFilterTree />
        <ListingTable />
      </Provider>
    );
    
    // Expand the parent category to show subcategories
    fireEvent.click(screen.getByTestId('expand-category-cat1'));
    
    // Navigate to a subcategory
    fireEvent.click(screen.getByTestId('category-filter-cat3'));
    
    // Verify filterByCategory was called
    expect(filterByCategory).toHaveBeenCalledWith('cat3');
    
    // Verify URL was updated to show the full category path
    expect(push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/listings',
        query: { category: 'cat3' },
      }),
      undefined,
      { shallow: true }
    );
  });
});
