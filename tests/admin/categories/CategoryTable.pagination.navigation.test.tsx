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

describe('CategoryTable Pagination - Navigation', () => {
  // Create a dataset with 25 items for pagination tests
  const paginatedCategories = createLargeCategorySet(25);

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('calls goToPage when pagination controls are clicked', async () => {
    const user = userEvent.setup();
    const mockGoToPage = jest.fn();

    // Mock the useCategories hook with our mock goToPage function
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(0, 10),
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false,
      goToPage: mockGoToPage
    }));

    const { rerender } = render(<CategoryTable />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Find pagination navigation buttons
    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).toBeInTheDocument();

    // Click next page button
    await user.click(nextPageButton);
    expect(mockGoToPage).toHaveBeenCalledWith(2);

    // Setup again with a different current page
    mockGoToPage.mockClear();
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(10, 20),
      totalPages: 3,
      currentPage: 2,
      itemsPerPage: 10,
      isLoading: false,
      goToPage: mockGoToPage
    }));

    // Re-render to apply the new state
    rerender(<CategoryTable />);

    // Wait for the component to load after re-render
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Find previous page button
    const prevPageButton = screen.getByTestId('previous-page-button');
    expect(prevPageButton).toBeInTheDocument();

    // Click previous page button
    await user.click(prevPageButton);
    expect(mockGoToPage).toHaveBeenCalledWith(1);
  });

  it('disables pagination buttons appropriately', async () => {
    // First page - prev button should be disabled
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(0, 10),
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false
    }));

    const { rerender } = render(<CategoryTable />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    const prevPageButton = screen.getByTestId('previous-page-button');
    expect(prevPageButton).toBeDisabled();

    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).not.toBeDisabled();

    // Last page - next button should be disabled
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(20, 25),
      totalPages: 3,
      currentPage: 3,
      itemsPerPage: 10,
      isLoading: false
    }));

    rerender(<CategoryTable />);

    // Wait for the component to load after re-render
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    const lastPrevButton = screen.getByTestId('previous-page-button');
    expect(lastPrevButton).not.toBeDisabled();

    const lastNextButton = screen.getByTestId('next-page-button');
    expect(lastNextButton).toBeDisabled();
  });
});
