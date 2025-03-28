/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import { 
  mockCategories, 
  setupCategoryTableTest, 
  resetMocks 
} from './helpers/categoryTableTestHelpers';

describe('CategoryTable Accessibility', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('has proper ARIA roles for table structure', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Table should have correct semantic structure
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    
    // Check for column headers
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThanOrEqual(4); // At minimum: Order, Name, Last Updated, Actions
    
    // Each row should have correct role
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBe(mockCategories.length + 1); // +1 for header row
    
    // First row should contain column headers
    const firstRow = rows[0];
    const headerCells = within(firstRow).getAllByRole('columnheader');
    expect(headerCells.length).toBeGreaterThanOrEqual(4);
    
    // Remaining rows should contain data cells
    const dataRows = rows.slice(1);
    dataRows.forEach(row => {
      const cells = within(row).getAllByRole('cell');
      expect(cells.length).toBeGreaterThanOrEqual(4);
    });
  });

  it('includes appropriate ARIA attributes for sorting', () => {
    setupCategoryTableTest({
      sortField: 'name',
      sortOrder: 'asc'
    });
    
    render(<CategoryTable />);
    
    // Find sortable column headers
    const nameHeader = screen.getByTestId('sort-header-name');
    expect(nameHeader).toBeInTheDocument();
    
    // The currently sorted column should have aria-sort attribute
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    // Other sortable columns should not have aria-sort
    const orderHeader = screen.getByTestId('sort-header-order');
    expect(orderHeader).not.toHaveAttribute('aria-sort');
    
    // For descending sort
    setupCategoryTableTest({
      sortField: 'updatedAt',
      sortOrder: 'desc'
    });
    
    render(<CategoryTable />);
    
    const updatedHeader = screen.getByTestId('sort-header-updatedAt');
    expect(updatedHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('provides accessible labels for interactive elements', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Search input should have accessible label
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('aria-label', 'Search categories');
    
    // Filter dropdowns should have accessible labels
    const parentFilter = screen.getByTestId('parent-filter-select');
    expect(parentFilter).toHaveAttribute('aria-label', 'Filter by parent category');
    
    const siteFilter = screen.getByTestId('site-filter-select');
    expect(siteFilter).toHaveAttribute('aria-label', 'Filter by site');
    
    // Action buttons should have accessible labels
    const deleteButtons = screen.getAllByTestId(/delete-button-/);
    deleteButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label', expect.stringMatching(/Delete .*/));
    });
  });

  it('supports keyboard navigation for interactive elements', async () => {
    const user = userEvent.setup();
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Tab to first interactive element (should be the search input)
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('search-input'));
    
    // Tab to the clear search button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('clear-search-button'));
    
    // Tab to the parent filter dropdown
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('parent-filter-select'));
    
    // Tab to the site filter dropdown
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('site-filter-select'));
    
    // Tab to the reset filters button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('reset-filters-button'));
    
    // Tab to the toggle hierarchy button
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('toggle-hierarchy-button'));
    
    // Tab to the first sortable column header
    await user.tab();
    const sortHeaders = screen.getAllByTestId(/sort-header-/);
    expect(document.activeElement).toBe(sortHeaders[0]);
    
    // Continue tabbing through all sortable headers
    for (let i = 1; i < sortHeaders.length; i++) {
      await user.tab();
      expect(document.activeElement).toBe(sortHeaders[i]);
    }
    
    // Tab to the first row's action buttons
    const firstRowActionButtons = screen.getAllByTestId(/^(view|edit|delete)-button-category_1$/);
    for (const button of firstRowActionButtons) {
      await user.tab();
      expect(document.activeElement).toBe(button);
    }
  });

  it('provides ARIA live regions for dynamic content changes', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Loading state should have role="status"
    const { rerender } = render(<CategoryTable />);
    
    // Update to loading state
    setupCategoryTableTest({ isLoading: true });
    rerender(<CategoryTable />);
    
    const loadingStatus = screen.getByTestId('loading-status');
    expect(loadingStatus).toHaveAttribute('role', 'status');
    
    // Error state should have role="alert"
    setupCategoryTableTest({ error: 'Error message' });
    rerender(<CategoryTable />);
    
    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toHaveAttribute('role', 'alert');
    
    // Pagination status should have role="status"
    setupCategoryTableTest();
    rerender(<CategoryTable />);
    
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toHaveAttribute('role', 'status');
  });
  
  it('has proper focus management for the delete modal', async () => {
    const user = userEvent.setup();
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    });
    
    render(<CategoryTable />);
    
    // Modal should be visible
    const modal = screen.getByTestId('delete-modal');
    expect(modal).toBeInTheDocument();
    
    // Cancel button should have initial focus
    const cancelButton = screen.getByTestId('cancel-delete-button');
    expect(document.activeElement).toBe(cancelButton);
    
    // Focus should be trapped within the modal
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Tabbing again should cycle back to the first focusable element
    await user.tab();
    expect(document.activeElement).toBe(cancelButton);
    
    // Modal should have aria-modal="true"
    expect(modal).toHaveAttribute('aria-modal', 'true');
    
    // Modal should have role="dialog"
    expect(modal).toHaveAttribute('role', 'dialog');
    
    // Modal should have aria-labelledby attribute
    const labelId = modal.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const modalTitle = document.getElementById(labelId!);
    expect(modalTitle).toBeInTheDocument();
    expect(modalTitle).toHaveTextContent('Delete Category');
  });
  
  it('provides appropriate keyboard shortcuts for common actions', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      setSearchTerm: mockSetSearchTerm
    });
    
    render(<CategoryTable />);
    
    // Focus the search input
    const searchInput = screen.getByTestId('search-input');
    searchInput.focus();
    
    // Type something in the search
    await user.type(searchInput, 'test');
    
    // Press Escape to clear the search
    await user.keyboard('{Escape}');
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    
    // Test for other keyboard shortcuts like sorting
    const mockHandleSort = jest.fn();
    setupCategoryTableTest({
      handleSort: mockHandleSort
    });
    
    render(<CategoryTable />);
    
    // Focus a sort header
    const nameHeader = screen.getByTestId('sort-header-name');
    nameHeader.focus();
    
    // Press Space to activate sorting
    await user.keyboard(' ');
    expect(mockHandleSort).toHaveBeenCalledWith('name');
    
    // Press Enter to activate sorting again
    await user.keyboard('{Enter}');
    expect(mockHandleSort).toHaveBeenCalledTimes(2);
  });
  
  it('ensures that delete confirmation dialog is accessible', async () => {
    const user = userEvent.setup();
    const mockHandleDelete = jest.fn();
    const mockCancelDelete = jest.fn();
    
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      handleDelete: mockHandleDelete,
      cancelDelete: mockCancelDelete
    });
    
    render(<CategoryTable />);
    
    // Modal should be accessible
    const modal = screen.getByTestId('delete-modal');
    
    // Modal should have proper ARIA attributes
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    
    // Cancel button should be focused initially
    const cancelButton = screen.getByTestId('cancel-delete-button');
    expect(document.activeElement).toBe(cancelButton);
    
    // Confirm button should be identifiable as a dangerous action
    const confirmButton = screen.getByTestId('confirm-delete-button');
    expect(confirmButton).toHaveClass('bg-red-600'); // Visual indicator
    
    // Keyboard activation should work
    await user.keyboard('{Enter}'); // Press Enter on the cancel button
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
    
    // Reset for testing confirm button
    mockCancelDelete.mockClear();
    
    // Re-render with the modal open
    setupCategoryTableTest({
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
      handleDelete: mockHandleDelete,
      cancelDelete: mockCancelDelete
    });
    
    render(<CategoryTable />);
    
    // Tab to the confirm button
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId('confirm-delete-button'));
    
    // Press Enter on the confirm button
    await user.keyboard('{Enter}');
    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    expect(mockHandleDelete).toHaveBeenCalledWith('category_1');
  });
  
  it('responds to Escape key to cancel delete modal', async () => {
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
    
    // Should call cancelDelete
    expect(mockCancelDelete).toHaveBeenCalledTimes(1);
  });
  
  it('includes skip links for keyboard users', async () => {
    const user = userEvent.setup();
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Check for the skip to main content link
    const skipLink = screen.getByTestId('skip-to-content-link');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-table-content');
    
    // Skip link should be visually hidden but keyboard focusable
    expect(skipLink).toHaveClass('sr-only');
    
    // The first tab should focus the skip link
    await user.tab();
    expect(document.activeElement).toBe(skipLink);
    
    // The target element should exist
    const mainContent = document.getElementById('main-table-content');
    expect(mainContent).toBeInTheDocument();
  });
  
  it('ensures all interactive elements have sufficient contrast', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Check buttons for proper color classes
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      // Primary buttons should have sufficient contrast
      if (button.classList.contains('bg-blue-600')) {
        expect(button).toHaveClass('text-white');
      }
      
      // Secondary buttons should have sufficient contrast
      if (button.classList.contains('bg-gray-200')) {
        expect(button).toHaveClass('text-gray-800');
      }
      
      // Danger buttons should have sufficient contrast
      if (button.classList.contains('bg-red-600')) {
        expect(button).toHaveClass('text-white');
      }
    });
    
    // Check that table cells have proper contrast
    const cells = screen.getAllByRole('cell');
    cells.forEach(cell => {
      // Dark text on light background
      expect(cell).toHaveClass('text-gray-900');
    });
  });
});
