/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCategories } from '../../../../src/components/admin/categories/hooks';
import { 
  mockCategories, 
  mockMultiSiteCategories,
  resetMocks
} from './useCategoriesTestHelpers';

describe('useCategories Hook - Filtering & Searching', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should filter categories by search term', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Search for "Subcategory"
    act(() => {
      result.current.setSearchTerm('Subcategory');
    });
    
    // Should filter to just the subcategory
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    
    // Clear search term
    act(() => {
      result.current.setSearchTerm('');
    });
    
    // Should show all categories again
    expect(result.current.filteredCategories.length).toBe(mockCategories.length);
  });

  it('should perform case-insensitive search', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Search with mixed case
    act(() => {
      result.current.setSearchTerm('sUbCaTeGoRy');
    });
    
    // Should still find the subcategory
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
  });

  it('should search in name, metaDescription, and parentName fields', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Search in name
    act(() => {
      result.current.setSearchTerm('Category 1');
    });
    
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].name).toBe('Test Category 1');
    
    // Search in metaDescription
    act(() => {
      result.current.setSearchTerm('subcategory');
    });
    
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].metaDescription).toBe('This is a subcategory');
    
    // Search in parentName (should match child categories with parent name)
    act(() => {
      result.current.setSearchTerm('Test Category 1');
    });
    
    // Should match both the parent category and its child
    expect(result.current.filteredCategories.length).toBe(2);
    expect(result.current.filteredCategories.some(c => c.id === 'category_1')).toBe(true);
    expect(result.current.filteredCategories.some(c => c.id === 'category_3')).toBe(true);
  });

  it('should filter categories by parent ID', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Filter by parent category_1
    act(() => {
      result.current.setParentFilter('category_1');
    });
    
    // Should only show children of category_1
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].parentId).toBe('category_1');
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    
    // Clear parent filter
    act(() => {
      result.current.setParentFilter('');
    });
    
    // Should show all categories again
    expect(result.current.filteredCategories.length).toBe(mockCategories.length);
  });

  it('should filter categories by site ID in multi-site mode', () => {
    // Use multi-site categories data
    const { result } = renderHook(() => useCategories(undefined, mockMultiSiteCategories));
    
    // Filter by site_1
    act(() => {
      result.current.setSiteFilter('site_1');
    });
    
    // Should only show categories from site_1
    expect(result.current.filteredCategories.length).toBe(3);
    result.current.filteredCategories.forEach(category => {
      expect(category.siteId).toBe('site_1');
    });
    
    // Filter by site_2
    act(() => {
      result.current.setSiteFilter('site_2');
    });
    
    // Should only show categories from site_2
    expect(result.current.filteredCategories.length).toBe(2);
    result.current.filteredCategories.forEach(category => {
      expect(category.siteId).toBe('site_2');
    });
    
    // Clear site filter
    act(() => {
      result.current.setSiteFilter('');
    });
    
    // Should show all categories again
    expect(result.current.filteredCategories.length).toBe(mockMultiSiteCategories.length);
  });

  it('should ignore site filter in single-site mode', () => {
    // Use multi-site categories data with siteSlug
    const { result } = renderHook(() => useCategories('test-site', mockMultiSiteCategories));
    
    // Try to set site filter
    act(() => {
      result.current.setSiteFilter('site_2');
    });
    
    // Should ignore site filter and show all categories
    expect(result.current.filteredCategories.length).toBe(mockMultiSiteCategories.length);
  });

  it('should apply multiple filters simultaneously', () => {
    const { result } = renderHook(() => useCategories(undefined, mockMultiSiteCategories));
    
    // Apply site filter and search term
    act(() => {
      result.current.setSiteFilter('site_1');
      result.current.setSearchTerm('Test');
    });
    
    // Should show only categories from site_1 with "Test" in name
    expect(result.current.filteredCategories.length).toBe(2);
    result.current.filteredCategories.forEach(category => {
      expect(category.siteId).toBe('site_1');
      expect(category.name.includes('Test')).toBe(true);
    });
    
    // Add parent filter
    act(() => {
      result.current.setParentFilter('category_1');
    });
    
    // Should return no categories (no category matches all filters)
    expect(result.current.filteredCategories.length).toBe(0);
  });

  it('should reset to first page when filters change', () => {
    // Create a scenario requiring pagination
    const largeDataset = Array.from({ length: 20 }, (_, i) => ({
      ...mockCategories[0],
      id: `category_${i + 1}`,
      name: `Test Category ${i + 1}`
    }));
    
    const { result } = renderHook(() => useCategories(undefined, largeDataset));
    
    // Navigate to second page
    act(() => {
      result.current.goToPage(2);
    });
    
    expect(result.current.currentPage).toBe(2);
    
    // Apply a filter
    act(() => {
      result.current.setSearchTerm('Test');
    });
    
    // Should reset to first page
    expect(result.current.currentPage).toBe(1);
  });

  it('should handle empty search results gracefully', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Search for non-existent term
    act(() => {
      result.current.setSearchTerm('NonExistentTerm');
    });
    
    // Should have empty filtered results
    expect(result.current.filteredCategories.length).toBe(0);
    
    // Current categories should also be empty
    expect(result.current.currentCategories.length).toBe(0);
    
    // Total pages should be 0
    expect(result.current.totalPages).toBe(0);
    
    // Current page should be 1 (minimum)
    expect(result.current.currentPage).toBe(1);
  });

  it('should maintain filter state after data is updated', async () => {
    // Initial render with mockCategories
    const { result, rerender } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Apply search filter
    act(() => {
      result.current.setSearchTerm('Subcategory');
    });
    
    expect(result.current.filteredCategories.length).toBe(1);
    
    // Simulate data update (e.g., after fetch)
    const updatedCategories = [
      ...mockCategories,
      {
        id: 'category_4',
        siteId: 'site_1',
        name: 'Another Subcategory',
        slug: 'another-subcategory',
        metaDescription: 'Another subcategory for testing',
        order: 3,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    // Update categories using act
    act(() => {
      // Simulate setting categories, normally done by fetch
      result.current.categories = updatedCategories;
    });
    
    // Rerender to trigger useEffect
    rerender();
    
    // Filter should still be applied to updated data
    // Now we should have 2 categories with "Subcategory" in the name
    expect(result.current.filteredCategories.length).toBe(2);
    result.current.filteredCategories.forEach(category => {
      expect(category.name.includes('Subcategory')).toBe(true);
    });
  });
});
