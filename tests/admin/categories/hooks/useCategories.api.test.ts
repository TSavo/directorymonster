/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCategories } from '../../../../src/components/admin/categories/hooks';
import {
  mockCategories,
  mockSites,
  mockFetchSuccess,
  mockFetchError,
  resetMocks
} from './useCategoriesTestHelpers';

// Store original fetch
const originalFetch = global.fetch;

describe('useCategories Hook - API Integration', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch categories data from the API on mount', async () => {
    // Mock fetch to return categories
    global.fetch = mockFetchSuccess(mockCategories);

    // Render hook without initial categories to trigger API fetch
    const { result } = renderHook(() => useCategories());

    // Initially should be in loading state
    expect(result.current.isLoading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify fetch was called with the correct endpoint
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');

    // Categories should be populated
    expect(result.current.categories.length).toBe(mockCategories.length);
    expect(result.current.categories.map(c => c.id)).toEqual(mockCategories.map(c => c.id));
    expect(result.current.categories.map(c => c.name)).toEqual(mockCategories.map(c => c.name));
  });

  it('should fetch site-specific categories when siteSlug is provided', async () => {
    // Mock fetch to return categories
    global.fetch = mockFetchSuccess(mockCategories);

    const siteSlug = 'test-site';

    // Render hook with site slug
    const { result } = renderHook(() => useCategories(siteSlug));

    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify fetch was called with site-specific endpoint
    expect(global.fetch).toHaveBeenCalledWith(`/api/sites/${siteSlug}/categories`);
  });

  it('should fetch sites data in multi-site mode', async () => {
    // Mock fetch to return different data for different endpoints
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/sites') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSites)
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories)
        });
      }
    });

    // Render hook without site slug (multi-site mode)
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify both categories and sites were fetched
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    expect(global.fetch).toHaveBeenCalledWith('/api/sites');

    // Sites should be populated
    expect(result.current.sites).toEqual(mockSites);
  });

  it('should not fetch sites in single-site mode', async () => {
    // Mock fetch for categories
    global.fetch = mockFetchSuccess(mockCategories);

    // Render hook with site slug (single-site mode)
    const { result } = renderHook(() => useCategories('test-site'));

    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify only categories were fetched, not sites
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/test-site/categories');
    expect(global.fetch).not.toHaveBeenCalledWith('/api/sites');
  });

  it('should handle API error states correctly', async () => {
    // Mock fetch to return an error
    const errorMessage = 'Failed to fetch categories';
    global.fetch = mockFetchError(errorMessage);

    // Mock console.error to avoid test output
    const consoleErrorOriginal = console.error;
    console.error = jest.fn();

    // Render hook without initial categories
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete and error to be set
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Error should be set
    expect(result.current.error).toContain(errorMessage);

    // Categories should be empty
    expect(result.current.categories).toEqual([]);

    // Error should be logged
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = consoleErrorOriginal;
  });

  it('should use fetchCategories to reload data on demand', async () => {
    // Start with initial categories
    const { result } = renderHook(() => useCategories(undefined, mockCategories));

    // Mock fetch to return updated categories
    const updatedCategories = [
      ...mockCategories,
      {
        id: 'new_category',
        siteId: 'site_1',
        name: 'New Category',
        slug: 'new-category',
        metaDescription: 'A new category',
        order: 3,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        childCount: 0,
        siteName: 'Test Site'
      }
    ];

    global.fetch = mockFetchSuccess(updatedCategories);

    // Call fetchCategories
    await act(async () => {
      await result.current.fetchCategories();
    });

    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/categories');

    // Categories should be updated
    expect(result.current.categories.length).toBe(updatedCategories.length);
    expect(result.current.categories.find(c => c.id === 'new_category')).toBeDefined();
  });

  it('should enrich API data with parent names and child counts', async () => {
    // Raw API data (without parentName or childCount)
    const rawApiData = [
      {
        id: 'parent_category',
        siteId: 'site_1',
        name: 'Parent Category',
        slug: 'parent-category',
        metaDescription: 'A parent category',
        order: 1,
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
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
        updatedAt: Date.now()
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
        updatedAt: Date.now()
      }
    ];

    // Mock fetch to return raw data
    global.fetch = mockFetchSuccess(rawApiData);

    // Render hook
    const { result } = renderHook(() => useCategories());

    // Wait for fetch to complete
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Verify parent names were added
    const childCategories = result.current.categories.filter(c => c.parentId === 'parent_category');
    childCategories.forEach(child => {
      expect(child.parentName).toBe('Parent Category');
    });

    // Verify child counts were added
    const parentCategory = result.current.categories.find(c => c.id === 'parent_category');
    expect(parentCategory).toBeDefined();
    expect(parentCategory?.childCount).toBe(2);
  });

  it('should handle multiple API calls properly for categories and sites', async () => {
    // Mock fetch to return different results for different endpoints
    let fetchCount = 0;

    global.fetch = jest.fn().mockImplementation((url) => {
      fetchCount++;

      if (url === '/api/sites') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSites)
        });
      } else {
        // For the first categories fetch, return error
        // For the second one (retry), return success
        if (fetchCount === 1) {
          return Promise.resolve({
            ok: false,
            statusText: 'Server Error',
            json: () => Promise.reject(new Error('Server Error'))
          });
        } else {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCategories)
          });
        }
      }
    });

    // Mock console.error
    const consoleErrorOriginal = console.error;
    console.error = jest.fn();

    // Render hook
    const { result } = renderHook(() => useCategories());

    // Wait for first fetch to complete (error)
    await waitFor(() => expect(result.current.error).toBeTruthy());

    // Error should be set
    expect(result.current.error).toContain('Server Error');

    // Now retry
    await act(async () => {
      await result.current.fetchCategories();
    });

    // Wait for the second fetch to complete
    await waitFor(() => expect(result.current.error).toBeNull());

    // Categories should be loaded
    expect(result.current.categories.length).toBe(mockCategories.length);
    expect(result.current.categories.map(c => c.id)).toEqual(mockCategories.map(c => c.id));
    expect(result.current.categories.map(c => c.name)).toEqual(mockCategories.map(c => c.name));

    // Restore console.error
    console.error = consoleErrorOriginal;
  });

  it('should prioritize initial categories over API fetch', async () => {
    // Mock fetch to return different categories
    const apiCategories = [{
      id: 'api_category',
      siteId: 'site_1',
      name: 'API Category',
      slug: 'api-category',
      metaDescription: 'Category from API',
      order: 1,
      parentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }];

    global.fetch = mockFetchSuccess(apiCategories);

    // Render hook with initial categories
    const { result } = renderHook(() => useCategories(undefined, mockCategories));

    // Categories should be the initial ones, not from API
    expect(result.current.categories).toEqual(mockCategories);

    // No loading state
    expect(result.current.isLoading).toBe(false);

    // API fetch for categories should not be called
    expect(global.fetch).not.toHaveBeenCalledWith('/api/categories');
  });
});
