import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTable } from '../../../../src/components/admin/listings/ListingTable';
import { CategoryFilterTree } from '../../../../src/components/admin/listings/components/table/CategoryFilterTree';

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock next router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock hooks implementation
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useCategories } from '../../../../src/components/admin/categories/hooks/useCategories';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Category Filtering and Navigation', () => {
  let store;
  let push;

  beforeEach(() => {
    // Mock router
    push = jest.fn().mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push,
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
      filterByCategory: jest.fn().mockImplementation((categoryId) => {
        // Update URL with category filter
        push({
          pathname: '/admin/listings',
          query: { category: categoryId },
        },
        undefined,
        { shallow: true });
      }),
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
        <CategoryFilterTree
          categories={[
            { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
            { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
            { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
          ]}
          selectedCategoryIds={[]}
          onChange={jest.fn()}
        />
        <ListingTable />
      </Provider>
    );

    // Verify categories are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();

    // Open the dropdown menu
    fireEvent.click(screen.getByTestId('category-filter-button'));

    // Navigate to a parent category
    fireEvent.click(screen.getByTestId('category-checkbox-cat1'));

    // Manually call filterByCategory
    filterByCategory('cat1');

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
        <CategoryFilterTree
          categories={[
            { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
            { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
            { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
          ]}
          selectedCategoryIds={['cat1']}
          onChange={jest.fn()}
        />
        <ListingTable />
      </Provider>
    );

    // Open the dropdown menu
    fireEvent.click(screen.getAllByTestId('category-filter-button')[0]);

    // Expand the parent category to show subcategories
    fireEvent.click(screen.getAllByTestId('toggle-category-cat1')[0]);

    // Navigate to a subcategory
    fireEvent.click(screen.getByTestId('category-checkbox-cat3'));

    // Manually call filterByCategory
    filterByCategory('cat3');

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
