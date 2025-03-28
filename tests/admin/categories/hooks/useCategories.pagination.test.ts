/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCategories } from '../../../../src/components/admin/categories/hooks';
import { 
  createPaginatedCategories,
  resetMocks
} from './useCategoriesTestHelpers';

describe('useCategories Hook - Pagination', () => {
  // Use a larger dataset for pagination tests
  const paginatedCategories = createPaginatedCategories(25);
  
  beforeEach(() => {
    resetMocks();
  });

  it('should initialize pagination with default settings', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Default page should be 1
    expect(result.current.currentPage).toBe(1);
    
    // Default items per page should be 10
    expect(result.current.itemsPerPage).toBe(10);
    
    // With 25 items and 10 per page, total pages should be 3
    expect(result.current.totalPages).toBe(3);
    
    // Current categories should have 10 items (page 1)
    expect(result.current.currentCategories.length).toBe(10);
    
    // Should be the first 10 items in the dataset
    expect(result.current.currentCategories[0].id).toBe('category_1');
    expect(result.current.currentCategories[9].id).toBe('category_10');
  });

  it('should update current categories when changing page', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Go to page 2
    act(() => {
      result.current.goToPage(2);
    });
    
    // Current page should be 2
    expect(result.current.currentPage).toBe(2);
    
    // Current categories should be items 11-20
    expect(result.current.currentCategories.length).toBe(10);
    expect(result.current.currentCategories[0].id).toBe('category_11');
    expect(result.current.currentCategories[9].id).toBe('category_20');
    
    // Go to page 3
    act(() => {
      result.current.goToPage(3);
    });
    
    // Current page should be 3
    expect(result.current.currentPage).toBe(3);
    
    // Current categories should be items 21-25 (only 5 items on page 3)
    expect(result.current.currentCategories.length).toBe(5);
    expect(result.current.currentCategories[0].id).toBe('category_21');
    expect(result.current.currentCategories[4].id).toBe('category_25');
  });

  it('should not go beyond valid page range', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Try to go to page 0 (invalid)
    act(() => {
      result.current.goToPage(0);
    });
    
    // Current page should still be 1 (minimum)
    expect(result.current.currentPage).toBe(1);
    
    // Try to go to page 4 (beyond max)
    act(() => {
      result.current.goToPage(4);
    });
    
    // Current page should still be 1 (since we haven't changed it)
    expect(result.current.currentPage).toBe(1);
    
    // Go to a valid page first
    act(() => {
      result.current.goToPage(2);
    });
    expect(result.current.currentPage).toBe(2);
    
    // Now try an invalid page
    act(() => {
      result.current.goToPage(100);
    });
    
    // Current page should still be 2
    expect(result.current.currentPage).toBe(2);
  });

  it('should update pagination when changing items per page', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Initially 10 items per page
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.totalPages).toBe(3);
    
    // Change to 5 items per page
    act(() => {
      result.current.setItemsPerPage(5);
    });
    
    // Now should be 5 items per page
    expect(result.current.itemsPerPage).toBe(5);
    
    // With 25 items and 5 per page, total pages should be 5
    expect(result.current.totalPages).toBe(5);
    
    // Current categories should have 5 items
    expect(result.current.currentCategories.length).toBe(5);
    
    // Change to 25 items per page
    act(() => {
      result.current.setItemsPerPage(25);
    });
    
    // Now should be 25 items per page
    expect(result.current.itemsPerPage).toBe(25);
    
    // With 25 items and 25 per page, total pages should be 1
    expect(result.current.totalPages).toBe(1);
    
    // Current categories should have all 25 items
    expect(result.current.currentCategories.length).toBe(25);
  });

  it('should reset to page 1 when changing items per page', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Go to page 2
    act(() => {
      result.current.goToPage(2);
    });
    expect(result.current.currentPage).toBe(2);
    
    // Change items per page
    act(() => {
      result.current.setItemsPerPage(5);
    });
    
    // Should reset to page 1
    expect(result.current.currentPage).toBe(1);
    
    // Current categories should be the first 5 items
    expect(result.current.currentCategories.length).toBe(5);
    expect(result.current.currentCategories[0].id).toBe('category_1');
    expect(result.current.currentCategories[4].id).toBe('category_5');
  });

  it('should handle pagination with filtered results', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Apply a filter that returns 5 items
    act(() => {
      result.current.setSearchTerm('category_1'); // matches category_1, category_10-19
    });
    
    // With 11 filtered items and 10 per page, total pages should be 2
    expect(result.current.filteredCategories.length).toBe(11);
    expect(result.current.totalPages).toBe(2);
    
    // Current categories should have 10 items (page 1)
    expect(result.current.currentCategories.length).toBe(10);
    
    // Go to page 2
    act(() => {
      result.current.goToPage(2);
    });
    
    // Current page should be 2
    expect(result.current.currentPage).toBe(2);
    
    // Current categories should have 1 item (remaining item on page 2)
    expect(result.current.currentCategories.length).toBe(1);
  });

  it('should handle edge case of zero filtered results', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Apply a filter that returns no items
    act(() => {
      result.current.setSearchTerm('NonExistentTerm');
    });
    
    // Filtered categories should be empty
    expect(result.current.filteredCategories.length).toBe(0);
    
    // Total pages should be 0
    expect(result.current.totalPages).toBe(0);
    
    // Current page should still be 1 (minimum)
    expect(result.current.currentPage).toBe(1);
    
    // Current categories should be empty
    expect(result.current.currentCategories.length).toBe(0);
  });

  it('should handle pagination when applying filters on non-first page', () => {
    const { result } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Go to page 3
    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);
    
    // Apply filter
    act(() => {
      result.current.setSearchTerm('category_1');
    });
    
    // Should reset to page 1
    expect(result.current.currentPage).toBe(1);
    
    // Filtered results should be visible
    expect(result.current.filteredCategories.length).toBe(11);
    expect(result.current.currentCategories.length).toBe(10);
  });

  it('should maintain current page when data doesn\'t change pagination', () => {
    // Create a hook with lots of data to have multiple pages
    const { result, rerender } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Go to page 2
    act(() => {
      result.current.goToPage(2);
    });
    expect(result.current.currentPage).toBe(2);
    
    // Simulate categories update that doesn't affect pagination
    // (same number of items, just different data)
    const updatedCategories = createPaginatedCategories(25);
    
    // Update categories using mock update
    act(() => {
      // Simulate setting categories, normally done by fetch
      result.current.categories = updatedCategories;
    });
    
    // Rerender to trigger useEffect
    rerender();
    
    // Current page should still be 2
    expect(result.current.currentPage).toBe(2);
    expect(result.current.totalPages).toBe(3);
  });

  it('should adjust current page when total pages decreases below current page', () => {
    // Start with 25 items (3 pages with 10 per page)
    const { result, rerender } = renderHook(() => useCategories(undefined, paginatedCategories));
    
    // Go to page 3
    act(() => {
      result.current.goToPage(3);
    });
    expect(result.current.currentPage).toBe(3);
    
    // Now update to only 15 items (2 pages with 10 per page)
    const fewerCategories = createPaginatedCategories(15);
    
    // Update categories using mock update
    act(() => {
      // Simulate setting categories, normally done by fetch
      result.current.categories = fewerCategories;
    });
    
    // Rerender to trigger useEffect
    rerender();
    
    // Should be on page 2 now (max page)
    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentPage).toBe(2);
  });
});
