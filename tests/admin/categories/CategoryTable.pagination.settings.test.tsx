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

// Create a larger dataset for pagination tests
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

describe('CategoryTable Pagination - Settings', () => {
  // Create a dataset with 25 items for pagination tests
  const paginatedCategories = createLargeCategorySet(25);

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('calls setItemsPerPage when items per page selector is changed', async () => {
    const user = userEvent.setup();
    const mockSetItemsPerPage = jest.fn();

    // Mock the useCategories hook with our mock setItemsPerPage function
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(0, 10),
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false,
      setItemsPerPage: mockSetItemsPerPage
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Find the items per page selector
    const itemsPerPageSelect = screen.getByTestId('items-per-page-select');
    expect(itemsPerPageSelect).toBeInTheDocument();

    // Change the selection to 25 items per page
    await user.selectOptions(itemsPerPageSelect, '25');

    // Verify setItemsPerPage was called with 25
    expect(mockSetItemsPerPage).toHaveBeenCalledWith(25);
  });
});
