/**
 * @jest-environment jsdom
 */
// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { siteSlug: 'test-site' },
    push: jest.fn(),
    pathname: '/admin/categories'
  })
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/admin/categories',
  useSearchParams: () => new URLSearchParams()
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import {
  mockCategories,
  setupCategoryTableTest,
  resetMocks
} from './helpers/categoryTableTestHelpers';

describe('CategoryTable Basic Rendering', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('renders the component with all expected sections', () => {
    setupCategoryTableTest();

    render(<CategoryTable />);

    // Verify the main container renders
    const container = screen.getByTestId('category-table-desktop');
    expect(container).toBeInTheDocument();

    // Verify the table container is rendered
    const tableContainer = container.querySelector('table');
    expect(tableContainer).toBeInTheDocument();

    // Verify the mobile view is not rendered in table mode
    expect(screen.queryByTestId('category-table-mobile')).not.toBeInTheDocument();

    // Verify pagination is rendered
    const pagination = screen.getByTestId('category-table-pagination');
    expect(pagination).toBeInTheDocument();
  });

  it('renders the loading state when isLoading is true', () => {
    setupCategoryTableTest({ isLoading: true });

    render(<CategoryTable />);

    // Should show loading skeleton with appropriate aria role
    const loadingStatus = screen.getByTestId('loading-status');
    expect(loadingStatus).toBeInTheDocument();
    expect(loadingStatus).toHaveTextContent('Loading categories data, please wait...');

    // Check that loading has appropriate role for accessibility
    expect(loadingStatus).toHaveAttribute('role', 'status');

    // Ensure the main table is not rendered during loading
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the error state when error is present', () => {
    const errorMessage = 'Failed to fetch categories';
    setupCategoryTableTest({ error: errorMessage });

    render(<CategoryTable />);

    // Should show error container
    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toBeInTheDocument();

    // Should show error title
    const errorTitle = screen.getByTestId('error-title');
    expect(errorTitle).toBeInTheDocument();
    expect(errorTitle).toHaveTextContent('Error Loading Categories');

    const errorMessageElement = screen.getByTestId('error-message');
    expect(errorMessageElement).toBeInTheDocument();
    expect(errorMessageElement).toHaveTextContent(errorMessage);

    // Should show retry button
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Retry');

    // Ensure the main table is not rendered during error
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the empty state when categories array is empty', () => {
    setupCategoryTableTest({
      categories: [],
      filteredCategories: [],
      currentCategories: []
    });

    render(<CategoryTable />);

    // Should show empty state
    const emptyState = screen.getByTestId('category-table-empty');
    expect(emptyState).toBeInTheDocument();

    // Find the empty state container inside
    const emptyStateContainer = emptyState.querySelector('[data-testid="empty-state-container"]');
    expect(emptyStateContainer).toBeInTheDocument();

    // Should contain appropriate messaging
    const emptyMessage = screen.getByTestId('empty-state-message');
    expect(emptyMessage).toBeInTheDocument();
    expect(emptyMessage).toHaveTextContent('No categories found.');

    // Should contain create button
    const createButton = screen.getByTestId('create-category-button');
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveTextContent('Create your first category');

    // Ensure the main table is not rendered for empty state
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders the correct number of category rows', () => {
    setupCategoryTableTest();

    render(<CategoryTable />);

    // Get the table container
    const tableContainer = screen.getByTestId('category-table-desktop');
    expect(tableContainer).toBeInTheDocument();

    // Find the table element
    const table = tableContainer.querySelector('table');
    expect(table).toBeInTheDocument();

    // Find all rows in the table
    const tableRows = table.querySelectorAll('tr');
    // +1 for the header row
    expect(tableRows.length).toBe(mockCategories.length + 1);

    // Check that category names are displayed in rows - using getAllByTestId to handle duplicates due to mobile view
    const category1Elements = screen.getAllByTestId('category-name-category_1');
    expect(category1Elements.length).toBeGreaterThan(0);
    expect(category1Elements[0]).toHaveTextContent('Test Category 1');

    const category2Elements = screen.getAllByTestId('category-name-category_2');
    expect(category2Elements.length).toBeGreaterThan(0);
    expect(category2Elements[0]).toHaveTextContent('Test Category 2');

    const category3Elements = screen.getAllByTestId('category-name-category_3');
    expect(category3Elements.length).toBeGreaterThan(0);
    expect(category3Elements[0]).toHaveTextContent('Child Category');
  });

  it('conditionally shows site column depending on mode', () => {
    // Multi-site mode
    setupCategoryTableTest();

    const { unmount } = render(<CategoryTable />);

    // Get the table container
    const tableContainer = screen.getByTestId('category-table-desktop');
    expect(tableContainer).toBeInTheDocument();

    // Find the table element
    const table = tableContainer.querySelector('table');
    expect(table).toBeInTheDocument();

    // Should show site column
    const siteColumnHeader = table.querySelector('th');
    expect(siteColumnHeader).toBeInTheDocument();

    unmount();

    // Single-site mode
    setupCategoryTableTest({
      sites: []
    });

    render(<CategoryTable siteSlug="test-site" />);

    // Should not show site column
    expect(screen.queryByText('Site')).not.toBeInTheDocument();
  });

  it('uses correct data-testid attributes for accessibility and testing', () => {
    setupCategoryTableTest();

    render(<CategoryTable />);

    // Verify key elements have proper test IDs
    expect(screen.getByTestId('category-table-desktop')).toBeInTheDocument();
    expect(screen.getByTestId('category-table-pagination')).toBeInTheDocument();

    // Verify each row has proper test IDs
    mockCategories.forEach(category => {
      // Mobile view category cards should have test IDs
      expect(screen.getByTestId(`category-card-${category.id}`)).toBeInTheDocument();

      // Category names should have test IDs in both desktop and mobile view
      const nameElements = screen.getAllByTestId(`category-name-${category.id}`);
      expect(nameElements.length).toBeGreaterThan(0);

      // Action buttons should have test IDs
      const deleteButtons = screen.getAllByTestId(`delete-button-${category.id}`);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('contains proper semantic structure for accessibility', () => {
    setupCategoryTableTest();

    render(<CategoryTable />);

    // Get the table container
    const tableContainer = screen.getByTestId('category-table-desktop');
    expect(tableContainer).toBeInTheDocument();

    // Find the table element
    const table = tableContainer.querySelector('table');
    expect(table).toBeInTheDocument();

    // Find the tbody element
    const tbody = table.querySelector('tbody');
    expect(tbody).toBeInTheDocument();

    // Find the thead element
    const thead = table.querySelector('thead');
    expect(thead).toBeInTheDocument();

    // Find column headers
    const columnHeaders = thead.querySelectorAll('th');
    expect(columnHeaders.length).toBeGreaterThanOrEqual(4);

    // Find rows
    const rows = table.querySelectorAll('tr');
    expect(rows.length).toBe(mockCategories.length + 1); // +1 for header row

    // Find cells
    const cells = tbody.querySelectorAll('td');
    expect(cells.length).toBeGreaterThan(0);

    // Verify buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify links
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
