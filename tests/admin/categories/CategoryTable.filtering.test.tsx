/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within, waitForElementToBeRemoved } from '@testing-library/react';
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

  it('renders search input and it calls setSearchTerm when used', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      setSearchTerm: mockSetSearchTerm
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for the component to render fully (not in loading state)
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the search input
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    expect(searchInput).toBeInTheDocument();
    
    // Type in the search input
    await user.type(searchInput, 'test search');
    
    // Verify setSearchTerm was called with the correct value
    expect(mockSetSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('renders parent filter dropdown with correct options', async () => {
    setupCategoryTableTest({
      isLoading: false
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the parent filter dropdown
    const parentFilterSelect = screen.getByRole('combobox', { name: /parent/i });
    expect(parentFilterSelect).toBeInTheDocument();
    
    // Check for parent category options (categories without a parentId)
    const parentCategories = mockCategories.filter(c => !c.parentId);
    
    // Open select to see options
    fireEvent.click(parentFilterSelect);
    
    // Check "All Categories" option exists
    const allOption = screen.getByRole('option', { name: /all categories/i });
    expect(allOption).toBeInTheDocument();
    
    // Check parent category options exist
    parentCategories.forEach(parent => {
      const option = screen.getByRole('option', { name: parent.name });
      expect(option).toBeInTheDocument();
    });
  });

  it('calls setParentFilter when parent filter is changed', async () => {
    const mockSetParentFilter = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      setParentFilter: mockSetParentFilter
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the parent filter dropdown
    const parentFilterSelect = screen.getByRole('combobox', { name: /parent/i });
    
    // Select a parent category (first one without parentId)
    const parentCategory = mockCategories.find(c => !c.parentId);
    
    // Use fireEvent because userEvent has issues with select elements
    fireEvent.change(parentFilterSelect, { target: { value: parentCategory.id } });
    
    // Verify setParentFilter was called with the correct category ID
    expect(mockSetParentFilter).toHaveBeenCalledWith(parentCategory.id);
  });

  it('shows site filter dropdown in multi-site mode', async () => {
    setupCategoryTableTest({
      isLoading: false
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the site filter dropdown
    const siteFilterSelect = screen.getByRole('combobox', { name: /site/i });
    expect(siteFilterSelect).toBeInTheDocument();
    
    // Check "All Sites" option exists
    fireEvent.click(siteFilterSelect);
    const allOption = screen.getByRole('option', { name: /all sites/i });
    expect(allOption).toBeInTheDocument();
    
    // Check site options exist
    mockSites.forEach(site => {
      const option = screen.getByRole('option', { name: site.name });
      expect(option).toBeInTheDocument();
    });
  });

  it('hides site filter dropdown in single-site mode', async () => {
    setupCategoryTableTest({
      isLoading: false,
      sites: []
    });
    
    await act(async () => {
      render(<CategoryTable siteSlug="test-site" />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Site filter should not be present
    const siteFilterSelect = screen.queryByRole('combobox', { name: /site/i });
    expect(siteFilterSelect).not.toBeInTheDocument();
  });

  it('calls setSiteFilter when site filter is changed', async () => {
    const mockSetSiteFilter = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      setSiteFilter: mockSetSiteFilter
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find the site filter dropdown
    const siteFilterSelect = screen.getByRole('combobox', { name: /site/i });
    
    // Select a site
    const site = mockSites[0];
    
    // Use fireEvent for select elements
    fireEvent.change(siteFilterSelect, { target: { value: site.id } });
    
    // Verify setSiteFilter was called with the correct site ID
    expect(mockSetSiteFilter).toHaveBeenCalledWith(site.id);
  });

  it('provides a search input that can be cleared', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      searchTerm: 'existing search',
      setSearchTerm: mockSetSearchTerm
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find a button that clears the search (could be an X icon or similar)
    const clearButton = screen.getByRole('button', { name: /clear|reset|×/i });
    expect(clearButton).toBeInTheDocument();
    
    // Click the clear button
    await user.click(clearButton);
    
    // Verify setSearchTerm was called with empty string
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
  });

  it('includes a reset filters function', async () => {
    const user = userEvent.setup();
    const mockSetSearchTerm = jest.fn();
    const mockSetParentFilter = jest.fn();
    const mockSetSiteFilter = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      searchTerm: 'test',
      parentFilter: 'category_1',
      siteFilter: 'site_1',
      setSearchTerm: mockSetSearchTerm,
      setParentFilter: mockSetParentFilter,
      setSiteFilter: mockSetSiteFilter
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Look for a reset filters button
    const resetButton = screen.getByRole('button', { name: /reset filters/i });
    expect(resetButton).toBeInTheDocument();
    
    // Click reset
    await user.click(resetButton);
    
    // Verify all filter reset functions were called
    expect(mockSetSearchTerm).toHaveBeenCalledWith('');
    expect(mockSetParentFilter).toHaveBeenCalledWith('');
    expect(mockSetSiteFilter).toHaveBeenCalledWith('');
  });

  it('displays the total number of categories', async () => {
    setupCategoryTableTest({
      isLoading: false,
      filteredCategories: mockCategories
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Look for a heading or element that shows the count
    const categoryCount = screen.getByTestId('category-count');
    expect(categoryCount).toBeInTheDocument();
    expect(categoryCount).toHaveTextContent(`Categories (${mockCategories.length})`);
  });

  it('shows a message when no categories match filters', async () => {
    setupCategoryTableTest({
      isLoading: false,
      categories: mockCategories,
      filteredCategories: [],
      currentCategories: []
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Look for an empty state message
    const emptyMessage = screen.getByText(/no categories/i);
    expect(emptyMessage).toBeInTheDocument();
  });

  it('performs a case-insensitive search', async () => {
    const user = userEvent.setup();
    
    // Mock filtered categories that would result from a search
    const testSearchResults = mockCategories.filter(
      category => category.name.toLowerCase().includes('test')
    );
    
    const mockSetSearchTerm = jest.fn();
    
    setupCategoryTableTest({
      isLoading: false,
      filteredCategories: testSearchResults,
      setSearchTerm: mockSetSearchTerm
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Find search input
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    
    // Enter search term
    await user.type(searchInput, 'TeSt');
    
    // Verify search function was called properly
    expect(mockSetSearchTerm).toHaveBeenCalledWith('TeSt');
    
    // Verify count reflects filtered results
    const countElement = screen.getByTestId('category-count');
    expect(countElement).toHaveTextContent(`Categories (${testSearchResults.length})`);
  });
  
  it('applies multiple filters simultaneously', async () => {
    const mockSetSearchTerm = jest.fn();
    const mockSetParentFilter = jest.fn();
    const mockSetSiteFilter = jest.fn();
    
    // Mock results that would come from multiple filters
    const filteredResults = mockCategories.filter(
      category => category.name.includes('Child') && category.parentId === 'category_1'
    );
    
    setupCategoryTableTest({
      isLoading: false,
      filteredCategories: filteredResults,
      setSearchTerm: mockSetSearchTerm,
      setParentFilter: mockSetParentFilter,
      setSiteFilter: mockSetSiteFilter
    });
    
    await act(async () => {
      render(<CategoryTable />);
    });
    
    // Wait for loading state to end
    await waitFor(() => {
      expect(screen.queryByTestId('loading-status')).not.toBeInTheDocument();
    });
    
    // Apply search filter
    const searchInput = screen.getByRole('textbox', { name: /search/i });
    fireEvent.change(searchInput, { target: { value: 'Child' } });
    expect(mockSetSearchTerm).toHaveBeenCalledWith('Child');
    
    // Apply parent filter
    const parentFilter = screen.getByRole('combobox', { name: /parent/i });
    fireEvent.change(parentFilter, { target: { value: 'category_1' } });
    expect(mockSetParentFilter).toHaveBeenCalledWith('category_1');
    
    // Apply site filter
    const siteFilter = screen.getByRole('combobox', { name: /site/i });
    fireEvent.change(siteFilter, { target: { value: 'site_1' } });
    expect(mockSetSiteFilter).toHaveBeenCalledWith('site_1');
    
    // Verify count reflects the filtered results
    const countElement = screen.getByTestId('category-count');
    expect(countElement).toHaveTextContent(`Categories (${filteredResults.length})`);
  });
});
