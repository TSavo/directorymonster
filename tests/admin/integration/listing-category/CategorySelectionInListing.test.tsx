import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { CategorySelectionStep } from '@/components/admin/listings/components/form/CategorySelectionStep';

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

  it('should allow selecting a category for a listing', async () => {
    const { updateFormField } = useListingForm();
    
    render(
      <Provider store={store}>
        <CategorySelectionStep />
      </Provider>
    );

    // Verify categories are displayed
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    
    // Select a category
    fireEvent.click(screen.getByTestId('category-select-cat1'));
    
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
    
    // Re-render with the selected category
    render(
      <Provider store={store}>
        <CategorySelectionStep />
      </Provider>
    );
    
    // Verify the category is marked as selected
    expect(screen.getByTestId('category-select-cat1')).toHaveAttribute('aria-selected', 'true');
    
    // Now select a subcategory of the selected category
    fireEvent.click(screen.getByTestId('category-select-cat3'));
    
    // Verify updateFormField was called with both categories
    expect(updateFormField).toHaveBeenCalledWith('categoryIds', ['cat1', 'cat3']);
  });
});
