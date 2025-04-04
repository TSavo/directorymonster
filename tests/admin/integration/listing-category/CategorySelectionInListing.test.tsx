import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { CategorySelectionStep } from '@/components/admin/listings/components/form/CategorySelectionStep';

// Mock fetch API
global.fetch = jest.fn();

// Mock the hooks and API calls
jest.mock('../../../../src/components/admin/listings/components/form/useListingForm', () => ({
  useListingForm: jest.fn(),
}));

jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
  useCategories: jest.fn(),
}));

// Mock hooks implementation
import { useListingForm } from '@/components/admin/listings/components/form/useListingForm';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';

const mockStore = configureStore([]);

describe('Integration: Category Selection in Listing Creation', () => {
  let store;

  beforeEach(() => {
    // Mock fetch API to return categories
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        categories: [
          { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
          { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
          { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
        ]
      })
    });
    // Mock the listing form hook
    (useListingForm as jest.Mock).mockReturnValue({
      formData: {
        title: 'Test Listing',
        description: 'This is a test listing',
        categoryIds: [],
      },
      updateFormField: jest.fn(),
      errors: {},
      validateField: jest.fn(() => ({})),
    });

    // Mock the categories hook
    let mockIsLoading = true;
    const mockCategories = [
      { id: 'cat1', name: 'Category 1', slug: 'category-1', parentId: null },
      { id: 'cat2', name: 'Category 2', slug: 'category-2', parentId: null },
      { id: 'cat3', name: 'Subcategory 1', slug: 'subcategory-1', parentId: 'cat1' },
    ];

    const mockGetCategoryById = jest.fn((id) => {
      return mockCategories.find(cat => cat.id === id);
    });

    const mockGetCategoryChildren = jest.fn((id) => {
      return mockCategories.filter(cat => cat.parentId === id);
    });

    (useCategories as jest.Mock).mockImplementation(() => {
      // First call returns loading state, subsequent calls return loaded state
      const result = {
        categories: mockIsLoading ? [] : mockCategories,
        isLoading: mockIsLoading,
        error: null,
        getCategoryById: mockGetCategoryById,
        getCategoryChildren: mockGetCategoryChildren
      };

      // Set loading to false after first call
      mockIsLoading = false;

      return result;
    });

    // Create a mock store
    store = mockStore({
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

  it.skip('should allow selecting a category for a listing', async () => {
    const { updateFormField } = useListingForm();

    render(
      <Provider store={store}>
        <CategorySelectionStep
          formData={{
            title: 'Test Listing',
            description: 'This is a test listing',
            categoryIds: [],
          }}
          errors={{}}
          updateField={updateFormField}
          isSubmitting={false}
          siteSlug="test-site"
        />
      </Provider>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.queryByText('Loading categories...')).not.toBeInTheDocument();
    });

    // Verify categories are displayed
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });

    // Select a category
    fireEvent.click(screen.getByTestId('category-checkbox-cat1'));

    // Verify updateFormField was called with the selected category
    expect(updateFormField).toHaveBeenCalledWith('categoryIds', ['cat1']);

    // Update formData to reflect the selected category
    (useListingForm as jest.Mock).mockReturnValue({
      formData: {
        title: 'Test Listing',
        description: 'This is a test listing',
        categoryIds: ['cat1'],
      },
      updateFormField,
      errors: {},
      validateField: jest.fn(() => ({})),
    });

    // Clean up the previous render
    document.body.innerHTML = '';

    // Re-render with the selected category
    render(
      <Provider store={store}>
        <CategorySelectionStep
          formData={{
            title: 'Test Listing',
            description: 'This is a test listing',
            categoryIds: ['cat1'],
          }}
          errors={{}}
          updateField={updateFormField}
          isSubmitting={false}
          siteSlug="test-site"
        />
      </Provider>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.queryByText('Loading categories...')).not.toBeInTheDocument();
    });

    // Verify the category checkbox is checked
    await waitFor(() => {
      const checkbox = screen.getByTestId('category-checkbox-cat1');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveProperty('checked', true);
    });

    // Now select a subcategory
    fireEvent.click(screen.getByTestId('category-checkbox-cat3'));

    // Verify updateFormField was called with both categories
    expect(updateFormField).toHaveBeenCalledWith('categoryIds', ['cat1', 'cat3']);
  });
});
