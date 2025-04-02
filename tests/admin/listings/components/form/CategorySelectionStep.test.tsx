import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategorySelectionStep } from '@/components/admin/listings/components/form/CategorySelectionStep';
import { ListingFormData, ListingStatus } from '@/components/admin/listings/types';
import { Category } from '@/components/admin/categories/types';

// Mock fetch API
global.fetch = jest.fn();

describe('CategorySelectionStep Component', () => {
  // Mock categories data
  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Category 1', slug: 'category-1', siteId: 'site1', tenantId: 'tenant1', metaDescription: 'Description 1', order: 1, createdAt: 1234567890, updatedAt: 1234567890 },
    { id: 'cat2', name: 'Category 2', slug: 'category-2', siteId: 'site1', tenantId: 'tenant1', metaDescription: 'Description 2', order: 2, createdAt: 1234567890, updatedAt: 1234567890 },
    { id: 'cat3', name: 'Category 3', slug: 'category-3', siteId: 'site1', tenantId: 'tenant1', metaDescription: 'Description 3', parentId: 'cat1', order: 1, createdAt: 1234567890, updatedAt: 1234567890 }
  ];
  
  // Default props
  const defaultProps = {
    formData: {
      title: 'Test Listing',
      description: 'Test description',
      status: ListingStatus.DRAFT,
      categoryIds: ['cat1'],
      media: []
    } as ListingFormData,
    errors: {},
    updateField: jest.fn(),
    isSubmitting: false,
    siteSlug: 'test-site'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: mockCategories })
    });
  });
  
  it('renders loading state initially', async () => {
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Should show loading state
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.queryByText('Loading categories...')).not.toBeInTheDocument();
    });
  });
  
  it('fetches and displays categories', async () => {
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
      expect(screen.getByText('Category 2')).toBeInTheDocument();
      expect(screen.getByText('Category 3')).toBeInTheDocument();
    });
    
    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/test-site/categories');
  });
  
  it('pre-selects categories based on formData', async () => {
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Wait for categories to load
    await waitFor(() => {
      const checkbox = screen.getByTestId('category-checkbox-cat1');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });
    
    // Other categories should not be checked
    await waitFor(() => {
      const checkbox = screen.getByTestId('category-checkbox-cat2');
      expect(checkbox).not.toBeChecked();
    });
  });
  
  it('calls updateField when a category is selected', async () => {
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 2')).toBeInTheDocument();
    });
    
    // Click on an unchecked category
    fireEvent.click(screen.getByTestId('category-checkbox-cat2'));
    
    // Should call updateField with both categories
    expect(defaultProps.updateField).toHaveBeenCalledWith('categoryIds', ['cat1', 'cat2']);
  });
  
  it('calls updateField when a category is unselected', async () => {
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });
    
    // Click on a checked category to uncheck it
    fireEvent.click(screen.getByTestId('category-checkbox-cat1'));
    
    // Should call updateField with empty array
    expect(defaultProps.updateField).toHaveBeenCalledWith('categoryIds', []);
  });
  
  it('displays validation errors when present', async () => {
    const propsWithErrors = {
      ...defaultProps,
      errors: {
        categoryIds: 'Please select at least one category'
      }
    };
    
    render(<CategorySelectionStep {...propsWithErrors} />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Please select at least one category')).toBeInTheDocument();
    });
  });
  
  it('disables checkboxes when isSubmitting is true', async () => {
    const submittingProps = {
      ...defaultProps,
      isSubmitting: true
    };
    
    render(<CategorySelectionStep {...submittingProps} />);
    
    // Wait for categories to load
    await waitFor(() => {
      const checkbox = screen.getByTestId('category-checkbox-cat1');
      expect(checkbox).toBeDisabled();
    });
  });
  
  it('handles fetch error gracefully', async () => {
    // Mock failed fetch
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load categories. Please try again.')).toBeInTheDocument();
    });
  });
  
  it('handles empty categories response', async () => {
    // Mock empty categories response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ categories: [] })
    });
    
    render(<CategorySelectionStep {...defaultProps} />);
    
    // Should show no categories message
    await waitFor(() => {
      expect(screen.getByText('No categories available.')).toBeInTheDocument();
    });
  });
  
  it('does not fetch categories when siteSlug is not provided', () => {
    const propsWithoutSiteSlug = {
      ...defaultProps,
      siteSlug: undefined
    };
    
    render(<CategorySelectionStep {...propsWithoutSiteSlug} />);
    
    // Should show loading state but not make fetch call
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
