/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useCategories } from '../../../src/components/admin/categories/hooks';

// Mock data
const mockCategories = [
  {
    id: 'category_1',
    siteId: 'site_1',
    name: 'Test Category 1',
    slug: 'test-category-1',
    metaDescription: 'This is test category 1',
    order: 1,
    parentId: null,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
  },
  {
    id: 'category_2',
    siteId: 'site_1',
    name: 'Test Category 2',
    slug: 'test-category-2',
    metaDescription: 'This is test category 2',
    order: 2,
    parentId: null,
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 7200000,   // 2 hours ago
  },
  {
    id: 'category_3',
    siteId: 'site_1',
    name: 'Subcategory 1',
    slug: 'subcategory-1',
    metaDescription: 'This is a subcategory',
    order: 1,
    parentId: 'category_1',
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now() - 1800000,  // 30 minutes ago
  }
];

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockCategories),
  })
) as jest.Mock;

describe('useCategories Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with provided categories data', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    expect(result.current.categories).toEqual(mockCategories);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch categories when no initialCategories are provided', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCategories('test-site'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.categories.length).toBe(mockCategories.length);
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/test-site/categories');
  });

  it('should handle search filtering correctly', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    act(() => {
      result.current.setSearchTerm('Subcategory');
    });
    
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    
    act(() => {
      result.current.setSearchTerm('');
    });
    
    expect(result.current.filteredCategories.length).toBe(3);
  });

  it('should handle parent filtering correctly', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    act(() => {
      result.current.setParentFilter('category_1');
    });
    
    expect(result.current.filteredCategories.length).toBe(1);
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    
    act(() => {
      result.current.setParentFilter('');
    });
    
    expect(result.current.filteredCategories.length).toBe(3);
  });

  it('should handle sorting correctly', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    // Default sort is by order ascending
    expect(result.current.sortField).toBe('order');
    expect(result.current.sortOrder).toBe('asc');
    
    // Sort by name
    act(() => {
      result.current.handleSort('name');
    });
    
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('asc');
    expect(result.current.filteredCategories[0].name).toBe('Subcategory 1');
    
    // Toggle sort direction
    act(() => {
      result.current.handleSort('name');
    });
    
    expect(result.current.sortField).toBe('name');
    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.filteredCategories[0].name).toBe('Test Category 2');
  });

  it('should handle pagination correctly', () => {
    // Create more mock data for pagination test
    const paginatedMockCategories = [...Array(15)].map((_, i) => ({
      id: `category_${i + 1}`,
      siteId: 'site_1',
      name: `Test Category ${i + 1}`,
      slug: `test-category-${i + 1}`,
      metaDescription: `This is test category ${i + 1}`,
      order: i + 1,
      parentId: null,
      createdAt: Date.now() - (i * 3600000),
      updatedAt: Date.now() - (i * 1800000),
    }));
    
    const { result } = renderHook(() => useCategories(undefined, paginatedMockCategories));
    
    // Default 10 items per page
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentCategories.length).toBe(10);
    
    // Go to second page
    act(() => {
      result.current.goToPage(2);
    });
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.currentCategories.length).toBe(5);
    
    // Change items per page
    act(() => {
      result.current.setItemsPerPage(5);
    });
    
    expect(result.current.itemsPerPage).toBe(5);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1); // Should reset to first page
  });

  it('should handle delete confirmation correctly', () => {
    const { result } = renderHook(() => useCategories(undefined, mockCategories));
    
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    expect(result.current.isDeleteModalOpen).toBe(true);
    expect(result.current.categoryToDelete).toEqual({
      id: 'category_1',
      name: 'Test Category 1'
    });
    
    act(() => {
      result.current.cancelDelete();
    });
    
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.categoryToDelete).toBeNull();
  });

  it('should handle delete operation correctly', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useCategories('test-site', mockCategories)
    );
    
    act(() => {
      result.current.confirmDelete('category_1', 'Test Category 1');
    });
    
    act(() => {
      result.current.handleDelete('category_1');
    });
    
    await waitForNextUpdate();
    
    expect(result.current.isDeleteModalOpen).toBe(false);
    expect(result.current.categoryToDelete).toBeNull();
    expect(result.current.categories.length).toBe(2);
    expect(result.current.categories.find(c => c.id === 'category_1')).toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/test-site/categories/category_1',
      { method: 'DELETE' }
    );
  });

  it('should handle fetch errors correctly', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.reject(new Error('API error'))
    );
    
    const { result, waitForNextUpdate } = renderHook(() => useCategories('test-site'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('API error');
    expect(result.current.categories.length).toBe(0);
  });
});
