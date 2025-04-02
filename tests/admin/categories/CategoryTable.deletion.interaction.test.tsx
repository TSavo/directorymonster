/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import * as useCategoriesModule from '../../../src/components/admin/categories/hooks/useCategories';
import {
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

describe('CategoryTable Deletion - Interaction', () => {
  // Create a dataset with 25 items for tests
  const paginatedCategories = createLargeCategorySet(25);

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('calls handleDelete when delete is confirmed', async () => {
    const user = userEvent.setup();
    const mockHandleDelete = jest.fn();

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
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      handleDelete: mockHandleDelete
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Wait for the modal to be visible
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-modal')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Find and click confirm button
    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);

    // Verify handleDelete was called with the right category ID
    expect(mockHandleDelete).toHaveBeenCalledWith('category_1');
  });

  it('calls cancelDelete when delete is cancelled', async () => {
    const user = userEvent.setup();
    const mockCancelDelete = jest.fn();

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
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      cancelDelete: mockCancelDelete
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Wait for the modal to be visible
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-modal')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Find and click cancel button
    const cancelButton = screen.getByTestId('cancel-button');
    await user.click(cancelButton);

    // Verify cancelDelete was called
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
  });

  it('closes the modal when escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockCancelDelete = jest.fn();

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
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      cancelDelete: mockCancelDelete
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Wait for the modal to be visible
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirmation-modal')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Press Escape key
    await user.keyboard('{Escape}');

    // Verify cancelDelete was called
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
  });
});
