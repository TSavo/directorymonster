/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '../../src/components/search/filters/SearchFilters';
import { Category } from '../../src/types';
import '@testing-library/jest-dom';

describe('SearchFilters Component', () => {
  // Sample data for testing
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Business',
      slug: 'business',
      parentId: null,
      siteId: 'site1',
      metaDescription: 'Business category description',
      featuredImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'cat2',
      name: 'Technology',
      slug: 'technology',
      parentId: null,
      siteId: 'site1',
      metaDescription: 'Technology category description',
      featuredImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'cat3',
      name: 'Health',
      slug: 'health',
      parentId: null,
      siteId: 'site1',
      metaDescription: 'Health category description',
      featuredImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const mockFilterChangeHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter sections correctly', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    // Check for filter header
    expect(screen.getByText('Filter Results')).toBeInTheDocument();
    
    // Check for category filter
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    
    // Check all categories are rendered in the dropdown
    mockCategories.forEach(category => {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    });
    
    // Check for featured filter
    expect(screen.getByText('Featured Items Only')).toBeInTheDocument();
    
    // Check for sort by filter
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Relevance')).toBeInTheDocument();
  });

  it('shows status filter when showStatusFilter is true', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        showStatusFilter={true}
      />
    );
    
    // Check for status filter
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('hides status filter when showStatusFilter is false', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        showStatusFilter={false}
      />
    );
    
    // Check status filter is not present
    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Published')).not.toBeInTheDocument();
  });

  it('selects a category and calls the filter change handler', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    // Select a category
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.change(categorySelect, { target: { value: 'cat2' } });
    
    // Check if filter change handler was called with correct args
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      categoryId: 'cat2'
    });
  });

  it('toggles featured filter and calls the filter change handler', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    // Check the featured checkbox
    const featuredCheckbox = screen.getByLabelText('Featured Items Only');
    fireEvent.click(featuredCheckbox);
    
    // Check if filter change handler was called with correct args
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      featured: true
    });
  });

  it('changes sort order and calls the filter change handler', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    // Change the sort order
    const sortSelect = screen.getByLabelText('Sort By');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });
    
    // Check if filter change handler was called with correct args
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      sortBy: 'newest'
    });
  });

  it('changes status and calls the filter change handler when admin', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        showStatusFilter={true}
      />
    );
    
    // Change the status
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.change(statusSelect, { target: { value: 'draft' } });
    
    // Check if filter change handler was called with correct args
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      status: 'draft'
    });
  });

  it('applies initial filters when provided', () => {
    const initialFilters = {
      categoryId: 'cat3',
      featured: true,
      status: 'published',
      sortBy: 'title_asc'
    };
    
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        initialFilters={initialFilters}
        showStatusFilter={true}
      />
    );
    
    // Check that the initial values are selected
    expect(screen.getByLabelText('Category')).toHaveValue('cat3');
    expect(screen.getByLabelText('Featured Items Only')).toBeChecked();
    expect(screen.getByLabelText('Status')).toHaveValue('published');
    expect(screen.getByLabelText('Sort By')).toHaveValue('title_asc');
  });

  it('handles empty categories array gracefully', () => {
    render(
      <SearchFilters 
        categories={[]} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    // Check that the component renders without categories
    expect(screen.getByText('Filter Results')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    
    // Should not have any category options beyond "All Categories"
    const categorySelect = screen.getByLabelText('Category');
    expect(categorySelect.children.length).toBe(1);
  });
});
