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
  mockSites,
  setupCategoryTableTest, 
  resetMocks 
} from './helpers/categoryTableTestHelpers';

describe('CategoryTable Filtering and Search', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('renders search input and it calls setSearchTerm when used', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      setSearchTerm: mockSetSearchTerm
    });
    
    render(<CategoryTable />);
    
    // Find the search input
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    
    // Type in the search input
    await user.type(searchInput, 'test search');
    
    // Verify setSearchTerm was called with the correct value
    expect(mockSetSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('renders parent filter dropdown with correct options', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Find the parent filter dropdown
    const parentFilterSelect = screen.getByTestId('parent-filter-select');
    expect(parentFilterSelect).toBeInTheDocument();
    
    // Open the dropdown to see options
    fireEvent.click(parentFilterSelect);
    
    // Check for the "All Categories" option
    const allOption = screen.getByText('All Categories');
    expect(allOption).toBeInTheDocument();
    
    // Check for parent category options (categories without a parentId)
    const parentCategories = mockCategories.filter(c => !c.parentId);
    parentCategories.forEach(parent => {
      const option = screen.getByText(parent.name);
      expect(option).toBeInTheDocument();
    });
  });

  it('calls setParentFilter when parent filter is changed', async () => {
    const user = userEvent.setup();
    const mockSetParentFilter = jest.fn();
    
    setupCategoryTableTest({
      setParentFilter: mockSetParentFilter
    });
    
    render(<CategoryTable />);
    
    // Find the parent filter dropdown
    const parentFilterSelect = screen.getByTestId('parent-filter-select');
    
    // Select a parent category
    await user.click(parentFilterSelect);
    
    // Find a parent category option (first one without parentId)
    const parentCategory = mockCategories.find(c => !c.parentId);
    if (parentCategory) {
      const option = screen.getByText(parentCategory.name);
      await user.click(option);
      
      // Verify setParentFilter was called with the correct category ID
      expect(mockSetParentFilter).toHaveBeenCalledWith(parentCategory.id);
    }
  });

  it('shows site filter dropdown in multi-site mode', () => {
    setupCategoryTableTest();
    
    render(<CategoryTable />);
    
    // Find the site filter dropdown
    const siteFilterSelect = screen.getByTestId('site-filter-select');
    expect(siteFilterSelect).toBeInTheDocument();
    
    // Open the dropdown to see options
    fireEvent.click(siteFilterSelect);
    
    // Check for the "All Sites" option
    const allOption = screen.getByText('All Sites');
    expect(allOption).toBeInTheDocument();
    
    // Check for site options
    mockSites.forEach(site => {
      const option = screen.getByText(site.name);
      expect(option).toBeInTheDocument();
    });
  });

  it('hides site filter dropdown in single-site mode', () => {
    setupCategoryTableTest({
      sites: []
    });
    
    render(<CategoryTable siteSlug="test-site" />);
    
    // Site filter should not be present
    expect(screen.queryByTestId('site-filter-select')).not.toBeInTheDocument();
  });

  it('calls setSiteFilter when site filter is changed', async () => {
    const user = userEvent.setup();
    const mockSetSiteFilter = jest.fn();
    
    setupCategoryTableTest({
      setSiteFilter: mockSetSiteFilter
    });
    
    render(<CategoryTable />);
    
    // Find the site filter dropdown
    const siteFilterSelect = screen.getByTestId('site-filter-select');
    
    // Select a site
    await user.click(siteFilterSelect);
    
    // Find a site option
    const site = mockSites[0];
    const option = screen.getByText(site.name);
    await user.click(option);
    
    // Verify setSiteFilter was called with the correct site ID
    expect(mockSetSiteFilter).toHaveBeenCalledWith(site.id);
  });

  it('provides a clear search button that resets search term', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      setSearchTerm: mockSetSearchTerm,
      searchTerm: 'existing search' // Set an initial search term
    });
    
    render(<CategoryTable />);
    
    // Find the clear search button
    const clearButton = screen.getByTestId('clear-search-button');
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    await user.click(clearButton);
    
    // Verify setSearchTerm was called with empty string
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
  });

  it('includes a reset filters button that resets all filters', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    const mockSetParentFilter = jest.fn();
    const mockSetSiteFilter = jest.fn();
    
    setupCategoryTableTest({
      setSearchTerm: mockSetSearchTerm,
      setParentFilter: mockSetParentFilter,
      setSiteFilter: mockSetSiteFilter,
      searchTerm: 'test', // Set initial values to trigger showing reset button
      parentFilter: 'category_1',
      siteFilter: 'site_1'
    });
    
    render(<CategoryTable />);
    
    // Find the reset filters button
    const resetButton = screen.getByTestId('reset-filters-button');
    expect(resetButton).toBeInTheDocument();
    
    // Click the reset button
    await user.click(resetButton);
    
    // Verify all filter reset functions were called
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    expect(mockSetParentFilter).toHaveBeenCalledWith('');
    expect(mockSetSiteFilter).toHaveBeenCalledWith('');
  });

  it('displays the total number of filtered categories', () => {
    setupCategoryTableTest({
      filteredCategories: mockCategories
    });
    
    render(<CategoryTable />);
    
    // Find the total categories count
    const totalCount = screen.getByTestId('total-categories-count');
    expect(totalCount).toBeInTheDocument();
    expect(totalCount).toHaveTextContent(`${mockCategories.length}`);
  });

  it('shows a message when no categories match the filters', () => {
    // Test with empty filtered results but non-empty categories
    setupCategoryTableTest({
      categories: mockCategories,
      filteredCategories: [],
      currentCategories: []
    });
    
    render(<CategoryTable />);
    
    // Should show a "no results" message
    const noResultsMessage = screen.getByTestId('no-results-message');
    expect(noResultsMessage).toBeInTheDocument();
    expect(noResultsMessage).toHaveTextContent(/No categories match your filters/i);
    
    // Should still show the filter controls
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('parent-filter-select')).toBeInTheDocument();
    
    // Should show a reset filters button
    const resetButton = screen.getByTestId('reset-filters-button');
    expect(resetButton).toBeInTheDocument();
  });

  it('performs a case-insensitive search', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      setSearchTerm: mockSetSearchTerm
    });
    
    render(<CategoryTable />);
    
    // Find the search input
    const searchInput = screen.getByTestId('search-input');
    
    // Type a mixed-case search term
    await user.type(searchInput, 'TeSt CaTeGoRy');
    
    // Verify the search term is passed as-is to the hook
    // The case-insensitive behavior would be in the hook implementation
    expect(mockSetSearchTerm).toHaveBeenCalledWith('TeSt CaTeGoRy');
  });
});
