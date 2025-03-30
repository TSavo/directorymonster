/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '../../../src/components/search/filters/SearchFilters';
import { Category } from '../../../src/types';
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
    
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      categoryId: 'cat2'
    });
  });

  it('calls filter change handler when featured checkbox toggles', () => {
    render(
      <SearchFilters 
        categories={mockCategories} 
        onFilterChange={mockFilterChangeHandler}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Featured Items Only'));
    
    expect(mockFilterChangeHandler).toHaveBeenCalledWith({
      featured: true
    });
  });

  it('applies initial filters when provided', () => {
    const initialFilters = {
      categoryId: 'cat2',
      featured: true,
      sortBy: 'newest'
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
});
