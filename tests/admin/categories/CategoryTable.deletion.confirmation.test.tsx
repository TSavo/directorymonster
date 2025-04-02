/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryTable from '@/components/admin/categories/CategoryTable';
import * as useCategoriesModule from '@/components/admin/categories/hooks/useCategories';
import {
  mockCategories,
  resetMocks,
  mockUseCategories
} from './helpers/categoryTableTestHelpers';

// Create a larger dataset for tests
const createLargeCategorySet = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `category_${i + 1}`,
    name: `Test Category ${i + 1}`,
    slug: `test-category-${i + 1}`,
    metaDescription: `This is test category ${i + 1}`,
    order: i + 1,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - (i * 3600000),
    updatedAt: Date.now() - (i * 1800000),
    childCount: 0,
    siteName: 'Test Site'
  }));
};

// Mock the useCategories hook
jest.mock('../../../src/components/admin/categories/hooks/useCategories', () => ({
  __esModule: true,
  useCategories: jest.fn()
}));

describe('CategoryTable Deletion - Confirmation', () => {
  // Create a dataset with 25 items for tests
  const paginatedCategories = createLargeCategorySet(25);

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('calls confirmDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockConfirmDelete = jest.fn();

    // Mock the useCategories hook with our mock confirmDelete function
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: mockCategories,
      filteredCategories: mockCategories,
      currentCategories: mockCategories,
      totalPages: 1,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false,
      confirmDelete: mockConfirmDelete
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Find the delete button for the first category
    const deleteButton = screen.getByTestId('delete-button-category_1');
    expect(deleteButton).toBeInTheDocument();

    // Click the delete button
    await user.click(deleteButton);

    // Verify confirmDelete was called with the right parameters
    expect(mockConfirmDelete).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });

  it('renders the delete confirmation modal correctly', async () => {
    // Mock the useCategories hook with delete modal open
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(0, 10),
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false,
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Modal should be visible
    const modal = screen.getByTestId('delete-confirmation-modal');
    expect(modal).toBeInTheDocument();

    // Modal should have correct title
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Category');

    // Modal should include category name
    expect(screen.getByTestId('item-name')).toHaveTextContent('"Test Category 1"');

    // Modal should have confirm and cancel buttons
    const confirmButton = screen.getByTestId('confirm-delete-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Delete');

    const cancelButton = screen.getByTestId('cancel-button');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel');
  });
});
