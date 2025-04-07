/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionFilter } from '../SubmissionFilter';
import { SubmissionStatus } from '@/types/submission';

describe('SubmissionFilter Component', () => {
  const mockOnFilterChange = jest.fn();
  const mockCategories = [
    { id: 'category-1', name: 'Category 1' },
    { id: 'category-2', name: 'Category 2' },
    { id: 'category-3', name: 'Category 3' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic filter controls', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Check that search input is rendered
    expect(screen.getByPlaceholderText('Search submissions...')).toBeInTheDocument();
    
    // Check that status select is rendered
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('expands to show advanced filters', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Advanced filters should not be visible initially
    expect(screen.queryByText('From Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    
    // Click expand button
    fireEvent.click(screen.getByText('Expand'));
    
    // Advanced filters should now be visible
    expect(screen.getByText('From Date')).toBeInTheDocument();
    expect(screen.getByText('To Date')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    
    // Categories should be rendered
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    expect(screen.getByText('Category 3')).toBeInTheDocument();
  });

  it('applies search filter', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Enter search text
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test search'
      })
    );
  });

  it('applies status filter', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Open status dropdown
    fireEvent.click(screen.getByText('Status'));
    
    // Select 'Pending' status
    fireEvent.click(screen.getByText('Pending'));
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: [SubmissionStatus.PENDING]
      })
    );
  });

  it('applies category filter', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Check category checkbox
    const categoryCheckbox = screen.getByLabelText('Category 1');
    fireEvent.click(categoryCheckbox);
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that onFilterChange was called with the correct filter
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryIds: ['category-1']
      })
    );
  });

  it('resets filters', () => {
    const initialFilters = {
      search: 'initial search',
      status: [SubmissionStatus.PENDING]
    };
    
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        initialFilters={initialFilters}
        categories={mockCategories}
      />
    );
    
    // Search input should have initial value
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    expect(searchInput).toHaveValue('initial search');
    
    // Click reset button
    fireEvent.click(screen.getByText('Reset'));
    
    // Check that onFilterChange was called with empty filter
    expect(mockOnFilterChange).toHaveBeenCalledWith({});
    
    // Search input should be cleared
    expect(searchInput).toHaveValue('');
  });

  it('initializes with provided filters', () => {
    const initialFilters = {
      search: 'initial search',
      status: [SubmissionStatus.PENDING],
      categoryIds: ['category-1']
    };
    
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        initialFilters={initialFilters}
        categories={mockCategories}
      />
    );
    
    // Search input should have initial value
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    expect(searchInput).toHaveValue('initial search');
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Category checkbox should be checked
    const categoryCheckbox = screen.getByLabelText('Category 1');
    expect(categoryCheckbox).toBeChecked();
  });
});
