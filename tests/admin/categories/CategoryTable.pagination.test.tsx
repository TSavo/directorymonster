/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import { 
  mockCategories, 
  setupCategoryTableTest, 
  resetMocks 
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

describe('CategoryTable Pagination and Deletion', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('renders pagination with correct information', () => {
    // Create a dataset with 25 items
    const largeDataset = createLargeCategorySet(25);
    
    // Setup with 10 items per page, showing first page (1-10 of 25)
    setupCategoryTableTest({
      categories: largeDataset,
      filteredCategories: largeDataset,
      currentCategories: largeDataset.slice(0, 10),
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 10
    });
    
    render(<CategoryTable />);
    
    // Find pagination status text
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toBeInTheDocument();
    expect(paginationStatus).toHaveTextContent('Showing 1 to 10 of 25 categories');
    
    // Check page indicator
    const pageIndicator = screen.getByTestId('page-indicator');
    expect(pageIndicator).toBeInTheDocument();
    expect(pageIndicator).toHaveTextContent('Page 1 of 3');
  });

  it('calls goToPage when pagination controls are clicked', async () => {
    const user = userEvent.setup();
    const mockGoToPage = jest.fn();
    
    // Setup with multiple pages
    setupCategoryTableTest({
      categories: createLargeCategorySet(25),
      filteredCategories: createLargeCategorySet(25),
      currentCategories: createLargeCategorySet(25).slice(0, 10),
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 10,
      goToPage: mockGoToPage
    });
    
    render(<CategoryTable />);
    
    // Find pagination navigation buttons
    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).toBeInTheDocument();
    
    // Click next page button
    await user.click(nextPageButton);
    expect(mockGoToPage).toHaveBeenCalledWith(2);
    
    // Setup again with a different current page
    mockGoToPage.mockClear();
    setupCategoryTableTest({
      categories: createLargeCategorySet(25),
      filteredCategories: createLargeCategorySet(25),
      currentCategories: createLargeCategorySet(25).slice(10, 20),
      currentPage: 2,
      totalPages: 3,
      itemsPerPage: 10,
      goToPage: mockGoToPage
    });
    
    render(<CategoryTable />);
    
    // Find previous page button
    const prevPageButton = screen.getByTestId('prev-page-button');
    expect(prevPageButton).toBeInTheDocument();
    
    // Click previous page button
    await user.click(prevPageButton);
    expect(mockGoToPage).toHaveBeenCalledWith(1);
  });

  it('disables pagination buttons appropriately', () => {
    // First page - prev button should be disabled
    setupCategoryTableTest({
      categories: createLargeCategorySet(25),
      filteredCategories: createLargeCategorySet(25),
      currentCategories: createLargeCategorySet(25).slice(0, 10),
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 10
    });
    
    render(<CategoryTable />);
    
    const prevPageButton = screen.getByTestId('prev-page-button');
    expect(prevPageButton).toBeDisabled();
    
    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).not.toBeDisabled();
    
    // Last page - next button should be disabled
    setupCategoryTableTest({
      categories: createLargeCategorySet(25),
      filteredCategories: createLargeCategorySet(25),
      currentCategories: createLargeCategorySet(25).slice(20, 25),
      currentPage: 3,
      totalPages: 3,
      itemsPerPage: 10
    });
    
    render(<CategoryTable />);
    
    const lastPrevButton = screen.getByTestId('prev-page-button');
    expect(lastPrevButton).not.toBeDisabled();
    
    const lastNextButton = screen.getByTestId('next-page-button');
    expect(lastNextButton).toBeDisabled();
  });

  it('calls setItemsPerPage when items per page selector is changed', async () => {
    const user = userEvent.setup();
    const mockSetItemsPerPage = jest.fn();
    
    setupCategoryTableTest({
      categories: createLargeCategorySet(25),
      filteredCategories: createLargeCategorySet(25),
      currentCategories: createLargeCategorySet(25).slice(0, 10),
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 10,
      setItemsPerPage: mockSetItemsPerPage
    });
    
    render(<CategoryTable />);
    
    // Find the items per page selector
    const itemsPerPageSelect = screen.getByTestId('items-per-page-select');
    expect(itemsPerPageSelect).toBeInTheDocument();
    
    // Change the selection
    await user.click(itemsPerPageSelect);
    
    // Find and click the 25 items per page option
    const option25 = screen.getByTestId('items-per-page-option-25');
    await user.click(option25);
    
    // Verify setItemsPerPage was called with 25
    expect(mockSetItemsPerPage).toHaveBeenCalledWith(25);
  });

  it('handles empty pages gracefully', () => {
    // Empty filtered categories should not show pagination
    setupCategoryTableTest({
      categories: mockCategories,
      filteredCategories: [],
      currentCategories: [],
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 10
    });
    
    render(<CategoryTable />);
    
    // Pagination status should indicate no results
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toHaveTextContent('Showing 0 to 0 of 0 categories');
    
    // Page navigation buttons should be disabled
    const prevPageButton = screen.getByTestId('prev-page-button');
    expect(prevPageButton).toBeDisabled();
    
    const nextPageButton = screen.getByTestId('next-page-button');
    expect(nextPageButton).toBeDisabled();
  });

  // Tests for delete functionality
  it('calls confirmDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const mockConfirmDelete = jest.fn();
    
    setupCategoryTableTest({
      confirmDelete: mockConfirmDelete
    });
    
    render(<CategoryTable />);
    
    // Find the delete button for the first category
    const deleteButton = screen.getAllByTestId('delete-button-category_1')[0];
    expect(deleteButton).toBeInTheDocument();
    
    // Click the delete button
    await user.click(deleteButton);
    
    // Verify confirmDelete was called with the right parameters
    expect(mockConfirmDelete).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });

  it('renders the delete confirmation modal correctly', () => {
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    });
    
    render(<CategoryTable />);
    
    // Modal should be visible
    const modal = screen.getByTestId('delete-modal');
    expect(modal).toBeInTheDocument();
    
    // Modal should have correct title
    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    
    // Modal should include category name
    expect(screen.getByText(/Test Category 1/)).toBeInTheDocument();
    
    // Modal should have confirm and cancel buttons
    const confirmButton = screen.getByTestId('confirm-delete-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Delete');
    
    const cancelButton = screen.getByTestId('cancel-delete-button');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toHaveTextContent('Cancel');
  });

  it('calls handleDelete when delete is confirmed', async () => {
    const user = userEvent.setup();
    const mockHandleDelete = jest.fn();
    
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      handleDelete: mockHandleDelete
    });
    
    render(<CategoryTable />);
    
    // Find and click confirm button
    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);
    
    // Verify handleDelete was called with the right category ID
    expect(mockHandleDelete).toHaveBeenCalledWith('category_1');
  });

  it('calls cancelDelete when delete is cancelled', async () => {
    const user = userEvent.setup();
    const mockCancelDelete = jest.fn();
    
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      cancelDelete: mockCancelDelete
    });
    
    render(<CategoryTable />);
    
    // Find and click cancel button
    const cancelButton = screen.getByTestId('cancel-delete-button');
    await user.click(cancelButton);
    
    // Verify cancelDelete was called
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
  });

  it('closes the modal when escape key is pressed', async () => {
    const user = userEvent.setup();
    const mockCancelDelete = jest.fn();
    
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      cancelDelete: mockCancelDelete
    });
    
    render(<CategoryTable />);
    
    // Press Escape key
    await user.keyboard('{Escape}');
    
    // Verify cancelDelete was called
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
  });

  it('handles deletion of the last item on a page', async () => {
    const user = userEvent.setup();
    
    // Setup with just one item on the current page
    setupCategoryTableTest({
      categories: createLargeCategorySet(11),
      filteredCategories: createLargeCategorySet(11),
      currentCategories: [createLargeCategorySet(11)[10]], // Just the last item
      currentPage: 2,
      totalPages: 2,
      itemsPerPage: 10
    });
    
    // Mock goToPage to verify it gets called when the last item is deleted
    const mockGoToPage = jest.fn();
    const mockHandleDelete = jest.fn(() => {
      // Simulate the behavior of handleDelete which would update the categories
      // After deletion, we'd have 10 items total, meaning just 1 page
      setupCategoryTableTest({
        categories: createLargeCategorySet(10),
        filteredCategories: createLargeCategorySet(10),
        currentCategories: [],
        currentPage: 2,
        totalPages: 1,
        itemsPerPage: 10,
        goToPage: mockGoToPage
      });
    });
    
    setupCategoryTableTest({
      categories: createLargeCategorySet(11),
      filteredCategories: createLargeCategorySet(11),
      currentCategories: [createLargeCategorySet(11)[10]], // Just the last item
      currentPage: 2,
      totalPages: 2,
      itemsPerPage: 10,
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_11', name: 'Test Category 11' },
      handleDelete: mockHandleDelete,
      goToPage: mockGoToPage
    });
    
    render(<CategoryTable />);
    
    // Find and click confirm button
    const confirmButton = screen.getByTestId('confirm-delete-button');
    await user.click(confirmButton);
    
    // Verify handleDelete was called
    expect(mockHandleDelete).toHaveBeenCalledWith('category_11');
    
    // In a real scenario, after the last item on page 2 is deleted,
    // The page would go back to page 1, but since we're mocking,
    // we have to manually check if goToPage would be called
    expect(mockGoToPage).toHaveBeenCalledWith(1);
  });
});
