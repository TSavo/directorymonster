/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useCategories } from '@/components/admin/categories/hooks';
import { 
  mockCategories, 
  mockFetchWithDelete,
  resetMocks
} from './useCategoriesTestHelpers';

// Store original fetch
const originalFetch = global.fetch;

describe('useCategories Hook - Deletion Functionality', () => {
  beforeEach(() => {
    resetMocks();
  });
  
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should set state correctly when confirming delete', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Initially, delete modal should be closed
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.categoryToDelete).toBeNull();
    
    // Confirm deletion for category_1
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    // Delete modal should be open with the correct category
    expect(result.current.isDeleteModalOpen).toBe(true);
    expect(result.current.categoryToDelete).toEqual({
      id: 'category_1',
      name: 'Test Category 1'
    });
  });

  it('should reset state when canceling delete', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Start with delete modal open
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    expect(result.current.isDeleteModalOpen).toBe(true);
    
    // Cancel deletion
    act(() => {
      result.current.cancelDelete();
    });
    
    // Delete modal should be closed, category to delete should be null
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.categoryToDelete).toBeNull();
  });

  it('should call DELETE API endpoint when handling delete', async () => {
    // Mock fetch for DELETE
    global.fetch = mockFetchWithDelete(mockCategories);
    
    // Create the hook with a site slug to test site-specific endpoint
    const { result } = renderHook(() => useCategories('test-site', mockCategories));
    
    // Confirm deletion for category_1
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    // Handle delete
    await act(async () => {
      await result.current.handleDelete('category_1');
    });
    
    // Verify fetch was called with DELETE method
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/test-site/categories/category_1',
      expect.objectContaining({ method: 'DELETE' })
    );
    
    // Delete modal should be closed
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.categoryToDelete).toBeNull();
    
    // Category should be removed from the state
    expect(result.current.categories.length).toBe(mockCategories.length - 1);
    expect(result.current.categories.find(c => c.id === 'category_1')).toBeUndefined();
  });

  it('should use the correct endpoint for multi-site vs single-site mode', async () => {
    // Test with multi-site mode (no site slug)
    global.fetch = mockFetchWithDelete(mockCategories);
    
    const { result: multiSiteResult } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Confirm and handle delete
    act(() => {
      multiSiteResult.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    await act(async () => {
      await multiSiteResult.current.handleDelete('category_1');
    });
    
    // Should use generic endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/categories/category_1',
      expect.objectContaining({ method: 'DELETE' })
    );
    
    // Reset mock
    jest.clearAllMocks();
    global.fetch = mockFetchWithDelete(mockCategories);
    
    // Test with site-specific mode
    const { result: siteResult } = renderHook(() => useCategories('test-site', mockCategories));
    
    // Confirm and handle delete
    act(() => {
      siteResult.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    await act(async () => {
      await siteResult.current.handleDelete('category_1');
    });
    
    // Should use site-specific endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/test-site/categories/category_1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should handle delete API errors gracefully', async () => {
    // Mock console.error to prevent output during tests
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Mock fetch to return an error for DELETE
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: false,
          statusText: 'Server Error',
          json: () => Promise.reject(new Error('Server Error'))
        });
      }
      
      // Default success case
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    });
    
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Confirm deletion
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    // Handle delete (which will fail)
    await act(async () => {
      await result.current.handleDelete('category_1');
    });
    
    // Error should be set
    expect(result.current.error).toBe('Failed to delete category: Server Error');
    
    // Category should not be removed from state
    expect(result.current.categories.length).toBe(mockCategories.length);
    expect(result.current.categories.find(c => c.id === 'category_1')).toBeDefined();
    
    // Modal should still be closed
    expect(result.current.isDeleteModalOpen).toBe(false);
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('should handle deleting the last item on a page correctly', async () => {
    // Create a scenario with 11 items, 10 per page, so second page has 1 item
    const elevenCategories = [...mockCategories, ...Array.from({ length: 8 }, (_, i) => ({
      id: `category_${i + 4}`,
      siteId: 'site_1',
      name: `Test Category ${i + 4}`,
      slug: `test-category-${i + 4}`,
      metaDescription: `This is test category ${i + 4}`,
      order: i + 4,
      parentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      childCount: 0,
      siteName: 'Test Site'
    }))];
    
    // Mock fetch for DELETE
    global.fetch = mockFetchWithDelete(elevenCategories);
    
    const { result } = renderHook(() => useCategories(undefined, elevenCategories));
    
    // Go to page 2
    act(() => {
      result.current.goToPage(2);
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentCategories.length).toBe(1);
    
    // Get the ID of the item on page 2
    const itemToDelete = result.current.currentCategories[0].id;
    
    // Confirm deletion for that item
    act(() => {
      result.current.confirmDelete(itemToDelete, result.current.currentCategories[0].name);
    });
    
    // Handle delete
    await act(async () => {
      await result.current.handleDelete(itemToDelete);
    });
    
    // Category should be deleted
    expect(result.current.categories.length).toBe(elevenCategories.length - 1);
    expect(result.current.categories.find(c => c.id === itemToDelete)).toBeUndefined();
    
    // Should automatically go back to page 1 since page 2 is now empty
    expect(result.current.currentPage).toBe(1);
  });
  
  it('should handle deleting a category with child categories', async () => {
    // Create a parent-child relationship
    const categoriesWithChildren = [
      {
        id: 'parent_category',
        siteId: 'site_1',
        name: 'Parent Category',
        slug: 'parent-category',
        metaDescription: 'A parent category',
        order: 1,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 2,
        siteName: 'Test Site'
      },
      {
        id: 'child_category_1',
        siteId: 'site_1',
        name: 'Child Category 1',
        slug: 'child-category-1',
        metaDescription: 'A child category',
        order: 1,
        parentId: 'parent_category',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentName: 'Parent Category',
        childCount: 0,
        siteName: 'Test Site'
      },
      {
        id: 'child_category_2',
        siteId: 'site_1',
        name: 'Child Category 2',
        slug: 'child-category-2',
        metaDescription: 'Another child category',
        order: 2,
        parentId: 'parent_category',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parentName: 'Parent Category',
        childCount: 0,
        siteName: 'Test Site'
      }
    ];
    
    // Mock fetch for DELETE
    global.fetch = mockFetchWithDelete(categoriesWithChildren);
    
    const { result } = renderHook(() => useCategories(undefined, categoriesWithChildren));
    
    // Delete the parent category
    act(() => {
      result.current.confirmDelete('parent_category', 'Parent Category');
    });
    
    await act(async () => {
      await result.current.handleDelete('parent_category');
    });
    
    // Parent should be removed
    expect(result.current.categories.length).toBe(categoriesWithChildren.length - 1);
    expect(result.current.categories.find(c => c.id === 'parent_category')).toBeUndefined();
    
    // Child categories should still exist
    // In a real implementation, the API might handle cascading deletes or orphaned children
    // But in our client-side state, they'd still be there initially
    expect(result.current.categories.find(c => c.id === 'child_category_1')).toBeDefined();
    expect(result.current.categories.find(c => c.id === 'child_category_2')).toBeDefined();
  });
  
  it('should handle concurrent delete operations properly', async () => {
    // Mock fetch to handle multiple delete operations
    let mockDeleted: string[] = [];
    
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        // Extract ID from URL
        const idMatch = url.match(/\/categories\/(.+)$/);
        if (idMatch && idMatch[1]) {
          mockDeleted.push(idMatch[1]);
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      }
      
      // Default case
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    });
    
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Start two delete operations in parallel
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    const deletePromise1 = result.current.handleDelete('category_1');
    
    // The second delete should wait for the first one to finish
    // in real implementations, but in testing we can force parallel operations
    act(() => {
      result.current.confirmDelete('category_2', 'Test Category 2');
    });
    
    const deletePromise2 = result.current.handleDelete('category_2');
    
    // Wait for both to complete
    await act(async () => {
      await Promise.all([deletePromise1, deletePromise2]);
    });
    
    // Both categories should be deleted
    expect(result.current.categories.length).toBe(mockCategories.length - 2);
    expect(result.current.categories.find(c => c.id === 'category_1')).toBeUndefined();
    expect(result.current.categories.find(c => c.id === 'category_2')).toBeUndefined();
    
    // Both should have been deleted from the API
    expect(mockDeleted).toContain('category_1');
    expect(mockDeleted).toContain('category_2');
  });
  
  it('should not remove category from state if deletion fails', async () => {
    // Mock fetch to succeed for the first delete but fail for the second
    global.fetch = jest.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        if (url.includes('category_1')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({})
          });
        } else {
          return Promise.resolve({
            ok: false,
            statusText: 'Cannot delete this category',
            json: () => Promise.reject(new Error('Cannot delete this category'))
          });
        }
      }
      
      // Default case
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    });
    
    // Mock console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Delete category_1 (should succeed)
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    await act(async () => {
      await result.current.handleDelete('category_1');
    });
    
    // category_1 should be removed
    expect(result.current.categories.find(c => c.id === 'category_1')).toBeUndefined();
    
    // Delete category_2 (should fail)
    act(() => {
      result.current.confirmDelete('category_2', 'Test Category 2');
    });
    
    await act(async () => {
      await result.current.handleDelete('category_2');
    });
    
    // category_2 should still be in the state
    expect(result.current.categories.find(c => c.id === 'category_2')).toBeDefined();
    
    // Error should be set
    expect(result.current.error).toBe('Failed to delete category: Cannot delete this category');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
