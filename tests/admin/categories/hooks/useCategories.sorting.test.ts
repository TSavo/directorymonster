/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCategories } from '../../../../src/components/admin/categories/hooks';
import { 
  mockCategories, 
  createPaginatedCategories,
  resetMocks
} from './useCategoriesTestHelpers';

describe('useCategories Hook - Sorting', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should use order as default sort field in ascending order', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Default sort should be order, asc
    expect(result.current.sortField).toBe('order');
    expect(result.current.sortOrder).toBe('asc');
    
    // Categories should be sorted by order
    expect(result.current.filteredCategories[0].order).toBe(1); // category_1 or category_3 (both have order 1)
    expect(result.current.filteredCategories[2].order).toBe(2); // category_2 (order 2)
  });

  it('should sort by name in ascending order', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Sort by name
    act(() => {
      result.current.handleSort('name');
    });
    
    // Sort field and order should be updated
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
    
    // Categories should be sorted alphabetically by name
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    expect(result.current.filteredCategories[1].name).toBe('Test Category 1');
    expect(result.current.filteredCategories[2].name).toBe('Test Category 2');
  });

  it('should sort by name in descending order', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Sort by name asc first, then toggle to desc
    act(() => {
      result.current.handleSort('name');
    });
    
    act(() => {
      result.current.handleSort('name'); // Toggle to desc
    });
    
    // Sort order should be desc
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('desc');
    
    // Categories should be sorted in reverse alphabetical order
    expect(result.current.filteredCategories[0].name).toBe('Test Category 2');
    expect(result.current.filteredCategories[1].name).toBe('Test Category 1');
    expect(result.current.filteredCategories[2].name).toBe('Subcategory 1');
  });

  it('should sort by createdAt date', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Sort by createdAt
    act(() => {
      result.current.handleSort('createdAt');
    });
    
    // Sort field should be createdAt
    expect(result.current.sortField).toBe('createdAt');
    expect(result.current.sortOrder).toBe('asc');
    
    // Categories should be sorted by creation date (oldest first in asc order)
    // category_2 is oldest (2 days ago)
    expect(result.current.filteredCategories[0].id).toBe('category_2');
    
    // Toggle to desc (newest first)
    act(() => {
      result.current.handleSort('createdAt');
    });
    
    // Category 3 is newest (12 hours ago)
    expect(result.current.filteredCategories[0].id).toBe('category_3');
  });

  it('should sort by updatedAt date', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Sort by updatedAt
    act(() => {
      result.current.handleSort('updatedAt');
    });
    
    // Sort field should be updatedAt
    expect(result.current.sortField).toBe('updatedAt');
    expect(result.current.sortOrder).toBe('asc');
    
    // Categories should be sorted by update date (oldest first in asc order)
    // category_2 is updated least recently (2 hours ago)
    expect(result.current.filteredCategories[0].id).toBe('category_2');
    
    // Toggle to desc (most recently updated first)
    act(() => {
      result.current.handleSort('updatedAt');
    });
    
    // Category 3 is updated most recently (30 minutes ago)
    expect(result.current.filteredCategories[0].id).toBe('category_3');
  });

  it('should toggle sort direction when clicking the same field', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Initial sort is order, asc
    expect(result.current.sortField).toBe('order');
    expect(result.current.sortOrder).toBe('asc');
    
    // Click on order again to toggle direction
    act(() => {
      result.current.handleSort('order');
    });
    
    // Sort should now be order, desc
    expect(result.current.sortField).toBe('order');
    expect(result.current.sortOrder).toBe('desc');
    
    // Categories should be sorted by order in reverse (highest first)
    expect(result.current.filteredCategories[0].order).toBe(2); // category_2 (order 2)
    
    // Toggle back to asc
    act(() => {
      result.current.handleSort('order');
    });
    
    // Sort should be order, asc again
    expect(result.current.sortField).toBe('order');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should reset to asc when changing sort field', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Start with name, desc
    act(() => {
      result.current.handleSort('name');
      result.current.handleSort('name'); // Toggle to desc
    });
    
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('desc');
    
    // Change to a different field
    act(() => {
      result.current.handleSort('updatedAt');
    });
    
    // Sort should be updatedAt, asc (reset to asc)
    expect(result.current.sortField).toBe('updatedAt');
    expect(result.current.sortOrder).toBe('asc');
  });

  it('should maintain sort when filters are applied', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Sort by name
    act(() => {
      result.current.handleSort('name');
    });
    
    // Apply a filter
    act(() => {
      result.current.setSearchTerm('Test'); // Will match Test Category 1 and 2
    });
    
    // Sort field should still be name
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
    
    // Filtered categories should be sorted by name
    expect(result.current.filteredCategories[0].name).toBe('Test Category 1');
    expect(result.current.filteredCategories[1].name).toBe('Test Category 2');
  });

  it('should handle sorting with pagination correctly', () => {
    // Create a dataset large enough for pagination
    const largeDataset = createPaginatedCategories(15);
    
    const { result } = renderHook(() => useCategories(undefined, largeDataset));
    
    // Default sort is order asc
    // Set items per page to 5 to have 3 pages
    act(() => {
      result.current.setItemsPerPage(5);
    });
    
    // First page should have items 1-5
    expect(result.current.currentCategories.length).toBe(5);
    expect(result.current.currentCategories[0].name).toBe('Test Category 1');
    expect(result.current.currentCategories[4].name).toBe('Test Category 5');
    
    // Sort by name desc
    act(() => {
      result.current.handleSort('name');
      result.current.handleSort('name'); // Toggle to desc
    });
    
    // First page should have items in reverse order (15-11)
    expect(result.current.currentCategories.length).toBe(5);
    expect(result.current.currentCategories[0].name).toBe('Test Category 15');
    expect(result.current.currentCategories[4].name).toBe('Test Category 11');
  });

  it('should handle undefined or null values during sorting', () => {
    // Create categories with some undefined/null values
    const categoriesWithNulls = [
      ...mockCategories,
      {
        id: 'category_null_order',
        siteId: 'site_1',
        name: 'Null Order Category',
        slug: 'null-order',
        metaDescription: 'Category with null order',
        order: null as unknown as number, // Cast to number for the test
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      },
      {
        id: 'category_undefined_name',
        siteId: 'site_1',
        name: undefined as unknown as string, // Cast to string for the test
        slug: 'undefined-name',
        metaDescription: 'Category with undefined name',
        order: 10,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    const { result } = renderHook(() => useCategories(undefined, categoriesWithNulls));
    
    // Sort by order
    act(() => {
      result.current.handleSort('order');
    });
    
    // Null values should be at the beginning or end when sorting
    // Check that it doesn't crash at least
    expect(result.current.filteredCategories.length).toBe(categoriesWithNulls.length);
    
    // Sort by name
    act(() => {
      result.current.handleSort('name');
    });
    
    // Again, check that it doesn't crash with undefined name
    expect(result.current.filteredCategories.length).toBe(categoriesWithNulls.length);
  });
});
