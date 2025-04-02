/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { delay } from '../../../utils/testHelpers';
import { useCategories } from '@/components/admin/categories/hooks';
import {
  mockCategories,
  mockSites,
  mockFetchSuccess,
  mockFetchError,
  resetMocks
} from './useCategoriesTestHelpers';

// Store original fetch
const originalFetch = global.fetch;

describe('useCategories Hook - Initialization & State Management', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should initialize with provided categories data', () => {
    // Render hook with initial categories
    const { result } = renderHook(() => useCategories(undefined, mockCategories));

    // Verify initial state
    expect(result.current.categories).toBeTruthy();
    expect(result.current.filteredCategories).toBeTruthy();
    expect(result.current.allCategories).toBeTruthy();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();

    // Verify default sorting and filtering state
    expect(result.current.searchTerm).toBeDefined();
    expect(result.current.parentFilter).toBeDefined();
    expect(result.current.siteFilter).toBeDefined();
    expect(result.current.sortField).toBeDefined();
    expect(result.current.sortOrder).toBeDefined();

    // Verify pagination defaults
    expect(result.current.currentPage).toBeDefined();
    expect(result.current.itemsPerPage).toBeDefined();
    expect(result.current.totalPages).toBeDefined();

    // Verify delete modal state
    expect(result.current.isDeleteModalOpen).toBeDefined();
    expect(result.current.categoryToDelete).toBeDefined();
  });

  it('should initialize with loading state and fetch categories when no initial data', async () => {
    // Mock fetch to return categories
    global.fetch = mockFetchSuccess(mockCategories);

    // Render hook without initial categories
    const { result } = renderHook(() => useCategories());

    // Verify initial loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.categories).toEqual([]);

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(2); // Once for categories, once for sites
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    expect(global.fetch).toHaveBeenCalledWith('/api/sites');

    // Verify state after fetch
    expect(result.current.isLoading).toBe(false);
    expect(result.current.categories.length).toBe(mockCategories.length);
    expect(result.current.error).toBeNull();
  });

  it('should fetch site-specific categories when siteSlug is provided', async () => {
    // Mock fetch to return categories
    global.fetch = mockFetchSuccess(mockCategories);

    // Set site slug
    const siteSlug = 'test-site';

    // Render hook with site slug
    const { result } = renderHook(() => useCategories(siteSlug));

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Verify fetch was called with site-specific endpoint
    expect(global.fetch).toHaveBeenCalledWith(`/api/sites/${siteSlug}/categories`);

    // Sites fetch should not be called with site slug
    expect(global.fetch).not.toHaveBeenCalledWith('/api/sites');

    // Verify site filter is set to the site slug
    expect(result.current.siteFilter).toBe(siteSlug);
  });

  it('should handle fetch errors gracefully', async () => {
    // Mock fetch to return error
    const errorMessage = 'Failed to fetch categories';
    global.fetch = mockFetchError(errorMessage);

    // Render hook without initial categories
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Verify error state
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.categories).toBeDefined();
  });

  it('should refetch categories when fetchCategories is called', async () => {
    // Setup with initial data
    const { result } = renderHook(() => useCategories(undefined, mockCategories));

    // Mock fetch for refetch
    global.fetch = mockFetchSuccess([...mockCategories, {
      id: 'new_category',
      siteId: 'site_1',
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'A new category',
      order: 3,
      parentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }]);

    // Call fetchCategories
    await act(async () => {
      await result.current.fetchCategories();
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');

    // Verify state was updated
    expect(result.current.isLoading).toBe(false);
    expect(result.current.categories.length).toBe(mockCategories.length + 1);
    expect(result.current.error).toBeNull();
  });

  it('should fetch sites for multi-site mode', async () => {
    // Mock fetch to return sites
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/sites') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSites)
        });
      }

      // Default case for categories
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    });

    // Render hook without site slug (multi-site mode)
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Verify sites fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/sites');

    // Verify sites state
    expect(result.current.sites).toEqual(mockSites);
  });

  it('should not fetch sites when in single-site mode', async () => {
    // Mock fetch for categories
    global.fetch = mockFetchSuccess(mockCategories);

    // Render hook with site slug (single-site mode)
    const { result } = renderHook(() => useCategories('test-site'));

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Verify sites fetch was not called
    expect(global.fetch).not.toHaveBeenCalledWith('/api/sites');

    // Sites should be empty
    expect(result.current.sites).toEqual([]);
  });

  it('should handle sites fetch errors gracefully', async () => {
    // Mock fetch to return error for sites, success for categories
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/sites') {
        return Promise.resolve({
          ok: false,
          statusText: 'Failed to fetch sites',
          json: () => Promise.reject(new Error('Failed to fetch sites'))
        });
      }

      // Success for categories
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    });

    // Mock console.error to avoid error output in tests
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Render hook without site slug
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete
    await act(async () => {
      await delay(100); // Wait for the async operations to complete
    });

    // Categories should be loaded
    expect(result.current.categories).toBeDefined();

    // Sites should be defined
    expect(result.current.sites).toBeDefined();

    // Error should be defined
    expect(result.current.error).toBeDefined();

    // Restore console.error
    console.error = originalConsoleError;
  });
});
