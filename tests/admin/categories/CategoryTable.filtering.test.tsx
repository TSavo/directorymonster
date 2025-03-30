/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import { 
  mockCategories, 
  mockSites,
  setupCategoryTableTest,
  resetMocks 
} from './helpers/categoryTableTestHelpers';

describe('CategoryTable Filtering and Search', () => {
  beforeEach(() => {
    resetMocks();
    
    // Default setup to avoid loading state
    setupCategoryTableTest({
      isLoading: false,
      error: null,
      categories: mockCategories,
      filteredCategories: mockCategories,
      currentCategories: mockCategories,
      allCategories: mockCategories,
      sites: mockSites
    });
  });

  it('renders search input', async () => {
    // Render the component
    render(<CategoryTable />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the search input using its label or test ID
    const searchInput = screen.getByRole('textbox', { name: /search/i }) || 
                       screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders parent filter dropdown with correct options', async () => {
    render(<CategoryTable />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the parent filter dropdown by role or test ID
    const parentFilterSelect = screen.getByRole('combobox', { name: /filter by parent/i }) ||
                              screen.getByTestId('parent-filter-select');
    expect(parentFilterSelect).toBeInTheDocument();
    
    // Check for parent category options (categories without a parentId)
    const parentCategories = mockCategories.filter(c => !c.parentId);
    
    // Check parent category options exist 
    for (const parent of parentCategories) {
      const optionElement = within(parentFilterSelect).queryByText(parent.name);
      expect(optionElement).toBeInTheDocument();
    }
  });

  it('shows site filter dropdown in multi-site mode', async () => {
    render(<CategoryTable />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the site filter dropdown
    const siteFilterSelect = screen.getByRole('combobox', { name: /filter by site/i }) ||
                            screen.getByTestId('site-filter-select');
    expect(siteFilterSelect).toBeInTheDocument();
    
    // Check site options exist
    for (const site of mockSites) {
      const optionElement = within(siteFilterSelect).queryByText(site.name);
      expect(optionElement).toBeInTheDocument();
    }
  });

  it('hides site filter dropdown in single-site mode', async () => {
    render(<CategoryTable siteSlug="test-site" />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Site filter should not be present
    const siteFilterSelect = screen.queryByRole('combobox', { name: /filter by site/i });
    expect(siteFilterSelect).not.toBeInTheDocument();
  });

  it('displays the total number of filtered categories', async () => {
    render(<CategoryTable />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Look for a heading that shows the count
    const categoryCount = screen.getByText(/categories.*\(\d+\)/i);
    expect(categoryCount).toBeInTheDocument();
    expect(categoryCount).toHaveTextContent(`Categories (${mockCategories.length})`);
  });

  it('displays empty state for no categories', async () => {
    // Setup with empty categories
    setupCategoryTableTest({
      isLoading: false,
      categories: [],
      filteredCategories: [],
      currentCategories: [],
      allCategories: []
    });
    
    render(<CategoryTable />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Check that the table body is empty or a message is displayed
    const tableElement = screen.queryByRole('table');
    
    if (tableElement) {
      // If there's a table, its body should be empty
      const tableRows = within(tableElement).queryAllByRole('row');
      // First row is header, so length should be 1 (or 0 if no header)
      expect(tableRows.length <= 1).toBeTruthy();
    } else {
      // If no table, there should be some kind of message
      const noContentMessage = screen.queryByText(/no categories|no results|empty|nothing to display/i);
      expect(noContentMessage).toBeTruthy();
    }
  });

  it('shows filtered results based on search term', async () => {
    // Setup with filtered results for "test"
    const filteredResults = mockCategories.filter(
      category => category.name.toLowerCase().includes('test')
    );
    
    setupCategoryTableTest({
      isLoading: false,
      filteredCategories: filteredResults
    });
    
    render(<CategoryTable />);
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Check that the category count displays the correct number
    const countElement = screen.getByText(/categories.*\(\d+\)/i);
    expect(countElement).toHaveTextContent(`Categories (${filteredResults.length})`);
    
    // Use queryAllBy to find all elements that contain category names
    // Check at least one of the expected category names appears in the document
    const testCategory1 = screen.queryAllByText('Test Category 1');
    const testCategory2 = screen.queryAllByText('Test Category 2');
    
    // There should be at least one element with each category name
    expect(testCategory1.length).toBeGreaterThan(0);
    expect(testCategory2.length).toBeGreaterThan(0);
  });
});
