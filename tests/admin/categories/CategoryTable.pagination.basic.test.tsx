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
  mockCategories,
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

describe('CategoryTable Pagination - Basic', () => {
  // Create a dataset with 25 items for pagination tests
  const paginatedCategories = createLargeCategorySet(25);

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  it('renders pagination with correct information', async () => {
    // Mock the useCategories hook to return our test data
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: paginatedCategories,
      filteredCategories: paginatedCategories,
      currentCategories: paginatedCategories.slice(0, 10),
      totalPages: 3,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false
    }));

    render(<CategoryTable />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Find pagination status text
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toBeInTheDocument();
    expect(paginationStatus).toHaveTextContent('Showing 1 to 10 of 25 categories');

    // Check page indicator
    const pageIndicator = screen.getByTestId('page-indicator');
    expect(pageIndicator).toBeInTheDocument();
    expect(pageIndicator).toHaveTextContent('Page 1 of 3');
  });

  it('handles empty pages gracefully', async () => {
    // Empty filtered categories should not show pagination
    // Mock the useCategories hook with empty categories
    (useCategoriesModule.useCategories as jest.Mock).mockImplementation(() => mockUseCategories({
      categories: mockCategories,
      filteredCategories: [],
      currentCategories: [],
      totalPages: 0,
      currentPage: 1,
      itemsPerPage: 10,
      isLoading: false
    }));

    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });

    // Pagination status should indicate no results
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toHaveTextContent('Showing 0 to 0 of 0 categories');

    // Page navigation buttons should be disabled
    const prevPageButton = screen.getByTestId('previous-page-button');
    expect(prevPageButton).toBeDisabled();

    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).toBeDisabled();
  });
});
