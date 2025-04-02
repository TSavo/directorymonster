/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '@/components/search/filters/SearchFilters';
import { Category } from '@/types';
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
    
    expect(screen.getByText('Filter Results')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Featured Items Only')).toBeInTheDocument();
    expect(screen.getByText('Sort By')).toBeInTheDocument();
  });

  it('shows status filter for admins', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        showStatusFilter={true}
      />
    );
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('All Statuses')).toBeInTheDocument();
  });

  it('calls filter change handler when category changes', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'cat2' } });
    
    // Accept either format of filter structure
    expect(mockFilterChangeHandler).toHaveBeenCalled();
    const filterCall = mockFilterChangeHandler.mock.calls[0][0];
    expect(filterCall.categoryId).toBe('cat2');
  });

  it('calls filter change handler when featured checkbox toggles', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Featured Items Only'));
    
    // Accept either format of filter structure
    expect(mockFilterChangeHandler).toHaveBeenCalled();
    const filterCall = mockFilterChangeHandler.mock.calls[0][0];
    expect(filterCall.featured).toBe(true);
  });

  it('applies initial filters when provided', () => {
    const initialFilters = {
      categoryId: 'cat2',
      featured: true,
      sortBy: 'newest',
      status: '' 
    };
    
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        initialFilters={initialFilters}
      />
    );
    
    expect(screen.getByLabelText('Category')).toHaveValue('cat2');
    expect(screen.getByLabelText('Featured Items Only')).toBeChecked();
    expect(screen.getByLabelText('Sort By')).toHaveValue('newest');
  });

  it('changes sort order and calls the filter change handler', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Sort By'), { target: { value: 'newest' } });
    
    // Accept either format of filter structure  
    expect(mockFilterChangeHandler).toHaveBeenCalled();
    const filterCall = mockFilterChangeHandler.mock.calls[0][0];
    expect(filterCall.sortBy).toBe('newest');
  });

  it('changes status and calls the filter change handler when admin', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
        showStatusFilter={true}
      />
    );
    
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'draft' } });
    
    // Accept either format of filter structure
    expect(mockFilterChangeHandler).toHaveBeenCalled();
    const filterCall = mockFilterChangeHandler.mock.calls[0][0];
    expect(filterCall.status).toBe('draft');
  });
});
