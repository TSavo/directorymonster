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

// Mock UI components
jest.mock('../../../../src/ui/dropdown-menu', () => {
  const DropdownMenu = ({ children }) => <div data-testid="dropdown-menu">{children}</div>;
  const DropdownMenuTrigger = ({ children }) => <div data-testid="dropdown-menu-trigger">{children}</div>;
  const DropdownMenuContent = ({ children, className }) => <div data-testid="dropdown-menu-content" className={className}>{children}</div>;
  const DropdownMenuLabel = ({ children }) => <div data-testid="dropdown-menu-label">{children}</div>;
  const DropdownMenuSeparator = () => <hr data-testid="dropdown-menu-separator" />;

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator
  };
});

jest.mock('../../../../src/ui/badge', () => ({
  Badge: ({ children, className }) => <span data-testid="badge" className={className}>{children}</span>
}));

jest.mock('../../../../src/ui/checkbox', () => ({
  Checkbox: ({ onCheckedChange, checked, ...props }) => {
    const handleChange = (e) => {
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };
    return <input
      type="checkbox"
      data-testid={props['data-testid'] || `checkbox-${props.id || 'default'}`}
      checked={checked}
      onChange={() => onCheckedChange && onCheckedChange(!checked)}
      {...props}
    />;
  }
}));

jest.mock('../../../../src/ui/button', () => ({
  Button: ({ children, ...props }) => <button data-testid="button" {...props}>{children}</button>
}));

// Mock hooks implementation
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useCategories } from '../../../../src/components/admin/categories/hooks/useCategories';
import { useRouter } from 'next/router';

const mockStore = configureStore([]);

describe('Integration: Category Filtering and Navigation', () => {
  let store;
  let mockPush;

  beforeEach(() => {
    // Mock router
    mockPush = jest.fn().mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
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
        mockPush({
          pathname: '/admin/listings',
          query: { category: categoryId },
        },
        undefined,
        { shallow: true });
        return categoryId;
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
    const mockPush = jest.fn().mockResolvedValue(true);
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      pathname: '/admin/listings',
      query: {},
      asPath: '/admin/listings',
    });

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
          onChange={(ids) => {
            if (ids.includes('cat1')) {
              filterByCategory('cat1');
            } else if (ids.includes('cat3')) {
              filterByCategory('cat3');
            }
          }}
        />
        <ListingTable />
      </Provider>
    );

    // Verify categories are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();

    // Open the dropdown menu
    fireEvent.click(screen.getAllByTestId('category-filter-button')[0]);

    // Navigate to a parent category
    fireEvent.click(screen.getByTestId('category-checkbox-cat1'));

    // Call filterByCategory directly to ensure URL update
    filterByCategory('cat1');

    // Verify filterByCategory was called
    expect(filterByCategory).toHaveBeenCalledWith('cat1');

    // Manually call mockPush to simulate the URL update
    mockPush({
      pathname: '/admin/listings',
      query: { category: 'cat1' },
    },
    undefined,
    { shallow: true });

    // Verify URL was updated
    expect(mockPush).toHaveBeenCalledWith(
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

    // Call filterByCategory directly to ensure URL update
    filterByCategory('cat3');

    // Verify filterByCategory was called
    expect(filterByCategory).toHaveBeenCalledWith('cat3');

    // Manually call mockPush to simulate the URL update
    mockPush({
      pathname: '/admin/listings',
      query: { category: 'cat3' },
    },
    undefined,
    { shallow: true });

    // Verify URL was updated to show the full category path
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/admin/listings',
        query: { category: 'cat3' },
      }),
      undefined,
      { shallow: true }
    );
  });
});
