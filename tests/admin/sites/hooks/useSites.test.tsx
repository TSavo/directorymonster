/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { SiteData, SiteFilters } from '@/components/admin/sites/hooks/useSites/types';

// Mock fetch function
global.fetch = jest.fn();

// Initial mock site data
const mockSite: SiteData = {
  id: 'site-1',
  name: 'Test Site',
  slug: 'test-site',
  description: 'A test site description',
  domains: ['test.com', 'example.com'],
  theme: 'default',
  isPublic: true
};

// Mock list of sites
const mockSites: SiteData[] = [
  mockSite,
  {
    id: 'site-2',
    name: 'Another Site',
    slug: 'another-site',
    domains: ['another.com'],
    theme: 'dark'
  }
];

describe('useSites Hook - Initialization and Basic Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('initializes with default values when no options provided', () => {
    const { result } = renderHook(() => useSites());
    
    // Verify initial state
    expect(result.current.site).toEqual({
      name: '',
      slug: '',
      domains: [],
      theme: 'default'
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
    expect(result.current.errors).toEqual({});
    expect(result.current.sites).toEqual([]);
    expect(result.current.filteredSites).toEqual([]);
    expect(result.current.totalSites).toBe(0);
  });

  it('initializes with provided initialData', () => {
    const { result } = renderHook(() => 
      useSites({ initialData: mockSite })
    );
    
    expect(result.current.site).toEqual(mockSite);
  });

  it('initializes with provided filters', () => {
    const defaultFilters: SiteFilters = {
      search: 'test',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 2,
      limit: 20
    };
    
    const { result } = renderHook(() => 
      useSites({ defaultFilters })
    );
    
    expect(result.current.filters).toEqual(defaultFilters);
  });

  it('updates site data with updateSite function', () => {
    const { result } = renderHook(() => useSites({ initialData: mockSite }));
    
    // Update a field
    act(() => {
      result.current.updateSite('name', 'Updated Name');
    });
    
    expect(result.current.site.name).toBe('Updated Name');
    
    // Update multiple fields using setSite
    const updatedSite = { ...mockSite, name: 'New Name', description: 'New description' };
    
    act(() => {
      result.current.setSite(updatedSite);
    });
    
    expect(result.current.site).toEqual(updatedSite);
  });

  it('clears field error when updating a field', () => {
    const { result } = renderHook(() => useSites({ initialData: mockSite }));
    
    // Set an error for the name field
    act(() => {
      result.current.validateSite();
      // Manually set an error to simulate validation failure
      result.current.errors.name = 'Name is required';
    });
    
    expect(result.current.errors.name).toBeDefined();
    
    // Update name - should clear the error
    act(() => {
      result.current.updateSite('name', 'Updated Name');
    });
    
    expect(result.current.errors.name).toBeUndefined();
  });

  it('uses resetErrors to clear all error messages', () => {
    const { result } = renderHook(() => useSites());
    
    // Set some errors
    act(() => {
      result.current.errors.name = 'Name is required';
      result.current.errors.slug = 'Invalid slug format';
      result.current.error = 'General error message';
    });
    
    // Reset errors
    act(() => {
      result.current.resetErrors();
    });
    
    // All errors should be cleared
    expect(result.current.errors).toEqual({});
    expect(result.current.error).toBeNull();
  });
});

describe('useSites Hook - Validation', () => {
  it('validates required fields', () => {
    const { result } = renderHook(() => useSites());
    
    // Try to validate empty form
    let isValid;
    act(() => {
      isValid = result.current.validateSite();
    });
    
    // Should be invalid due to required fields
    expect(isValid).toBe(false);
    expect(result.current.errors.name).toBeDefined();
    expect(result.current.errors.slug).toBeDefined();
    expect(result.current.errors.domains).toBeDefined();
  });

  it('validates specific sections', () => {
    const { result } = renderHook(() => useSites({
      initialData: {
        name: 'Test Site',
        slug: 'test-site',
        domains: ['example.com'],
        theme: 'default',
        seoTitle: 'Very long SEO title that exceeds the maximum length of sixty characters and should trigger validation error'
      }
    }));
    
    // Validate only the SEO section
    let isValid;
    act(() => {
      isValid = result.current.validateSite('seo');
    });
    
    // Should be invalid due to SEO title length
    expect(isValid).toBe(false);
    expect(result.current.errors.seoTitle).toBeDefined();
    
    // Other sections should not be validated
    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.errors.slug).toBeUndefined();
  });

  it('validates slug format', () => {
    const { result } = renderHook(() => useSites());
    
    // Set invalid slug format
    act(() => {
      result.current.updateSite('name', 'Test Site');
      result.current.updateSite('slug', 'Invalid Slug!');
      result.current.updateSite('domains', ['example.com']);
    });
    
    // Validate
    let isValid;
    act(() => {
      isValid = result.current.validateSite('basic');
    });
    
    // Should be invalid due to slug format
    expect(isValid).toBe(false);
    expect(result.current.errors.slug).toBeDefined();
    expect(result.current.errors.slug).toContain('lowercase letters, numbers, and hyphens');
  });

  it('validates character limits', () => {
    const { result } = renderHook(() => useSites());
    
    // Set values exceeding limits
    act(() => {
      result.current.updateSite('name', 'A'.repeat(51)); // > 50 chars
      result.current.updateSite('slug', 'a'.repeat(51)); // > 50 chars
      result.current.updateSite('description', 'A'.repeat(501)); // > 500 chars
      result.current.updateSite('domains', ['example.com']);
    });
    
    // Validate
    let isValid;
    act(() => {
      isValid = result.current.validateSite();
    });
    
    // Should be invalid due to length limits
    expect(isValid).toBe(false);
    expect(result.current.errors.name).toContain('50 characters');
    expect(result.current.errors.slug).toContain('50 characters');
    expect(result.current.errors.description).toContain('500 characters');
  });

  it('validates custom CSS syntax', () => {
    const { result } = renderHook(() => useSites());
    
    // Set unbalanced braces in CSS
    act(() => {
      result.current.updateSite('customStyles', 'body { color: red;');
    });
    
    // Validate theme section
    let isValid;
    act(() => {
      isValid = result.current.validateSite('theme');
    });
    
    // Should be invalid due to unbalanced braces
    expect(isValid).toBe(false);
    expect(result.current.errors.customStyles).toContain('unbalanced braces');
  });

  it('passes validation with valid data', () => {
    const { result } = renderHook(() => useSites({
      initialData: {
        name: 'Valid Site',
        slug: 'valid-site',
        description: 'A valid site description',
        domains: ['example.com'],
        theme: 'default',
        customStyles: 'body { color: blue; }',
        seoTitle: 'Valid SEO Title',
        seoDescription: 'Valid SEO description under 160 characters',
        contactEmail: 'valid@example.com',
        listingsPerPage: 25
      }
    }));
    
    // Validate all sections
    let isValid;
    act(() => {
      isValid = result.current.validateSite();
    });
    
    // Should be valid
    expect(isValid).toBe(true);
    expect(Object.keys(result.current.errors).length).toBe(0);
  });
});

describe('useSites Hook - API Integration', () => {
  it('fetches a single site by ID', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSite
    });
    
    const { result } = renderHook(() => useSites());
    
    // Fetch site
    let fetchResult;
    await act(async () => {
      fetchResult = await result.current.fetchSite('site-1');
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1');
    
    // Should return site data
    expect(fetchResult).toEqual(mockSite);
    
    // Loading state should be properly managed
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches all sites with filters', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: mockSites, total: mockSites.length })
    });
    
    const { result } = renderHook(() => useSites({
      defaultFilters: {
        search: 'test',
        sortBy: 'name',
        page: 1
      }
    }));
    
    // Fetch sites
    let fetchResult;
    await act(async () => {
      fetchResult = await result.current.fetchSites();
    });
    
    // Verify fetch was called with correct query params
    expect(global.fetch).toHaveBeenCalledWith('/api/sites?search=test&sortBy=name&page=1');
    
    // Should return sites data
    expect(fetchResult).toEqual(mockSites);
    expect(result.current.sites).toEqual(mockSites);
    expect(result.current.totalSites).toBe(mockSites.length);
    
    // Loading state should be properly managed
    expect(result.current.isLoading).toBe(false);
  });

  it('refreshes sites list', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: mockSites, total: mockSites.length })
    });
    
    const { result } = renderHook(() => useSites());
    
    // Refresh sites
    await act(async () => {
      await result.current.refreshSites();
    });
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/sites');
    
    // Sites should be updated
    expect(result.current.sites).toEqual(mockSites);
  });

  it('creates a new site', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-site-id', ...mockSite })
    });
    
    const { result } = renderHook(() => useSites({
      initialData: mockSite
    }));
    
    // Create site
    let createResult;
    await act(async () => {
      createResult = await result.current.createSite();
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(mockSite)
    }));
    
    // Should return success and data
    expect(createResult.success).toBe(true);
    expect(createResult.data).toHaveProperty('id', 'new-site-id');
    
    // Success message should be set
    expect(result.current.success).toContain('created successfully');
  });

  it('validates data before creating a site', async () => {
    const { result } = renderHook(() => useSites({
      initialData: {
        name: '', // Missing required field
        slug: 'test-site',
        domains: ['example.com']
      }
    }));
    
    // Try to create site with invalid data
    let createResult;
    await act(async () => {
      createResult = await result.current.createSite();
    });
    
    // Should fail validation and not call API
    expect(createResult.success).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Errors should be set
    expect(result.current.errors.name).toBeDefined();
  });

  it('updates an existing site', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockSite, name: 'Updated Site' })
    });
    
    const { result } = renderHook(() => useSites({
      initialData: { ...mockSite, name: 'Updated Site' }
    }));
    
    // Update site
    let updateResult;
    await act(async () => {
      updateResult = await result.current.saveSite('site-1');
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ ...mockSite, name: 'Updated Site' })
    }));
    
    // Should return success
    expect(updateResult.success).toBe(true);
    
    // Success message should be set
    expect(result.current.success).toContain('updated successfully');
  });

  it('deletes a site', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });
    
    // For refreshSites called after deletion
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [mockSites[1]], total: 1 })
    });
    
    const { result } = renderHook(() => useSites());
    
    // Delete site
    let deleteResult;
    await act(async () => {
      deleteResult = await result.current.deleteSite('site-1');
    });
    
    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1', expect.objectContaining({
      method: 'DELETE'
    }));
    
    // Should return success
    expect(deleteResult.success).toBe(true);
    
    // Success message should be set
    expect(result.current.success).toContain('deleted successfully');
    
    // Sites list should be refreshed
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('handles API errors gracefully', async () => {
    // Mock failed API response
    const errorMessage = 'Server error';
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage })
    });
    
    const { result } = renderHook(() => useSites({
      initialData: mockSite
    }));
    
    // Try to save site
    let saveResult;
    await act(async () => {
      saveResult = await result.current.saveSite('site-1');
    });
    
    // Should return failure
    expect(saveResult.success).toBe(false);
    
    // Error message should be set
    expect(result.current.error).toBe(errorMessage);
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useSites());
    
    // Try to fetch sites
    await act(async () => {
      await result.current.fetchSites();
    });
    
    // Loading state should be properly managed
    expect(result.current.isLoading).toBe(false);
    
    // Error should be set
    expect(result.current.error).toBeDefined();
    
    // Sites should be empty
    expect(result.current.sites).toEqual([]);
  });

  it('handles filters changes and updates filtered sites', async () => {
    // Mock fetch response with initial sites
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: mockSites, total: mockSites.length })
    });
    
    const { result } = renderHook(() => useSites());
    
    // Load initial sites
    await act(async () => {
      await result.current.fetchSites();
    });
    
    // Change filters
    const newFilters = {
      search: 'Another',
      sortBy: 'updatedAt',
      sortOrder: 'desc' as const,
      page: 1,
      limit: 10
    };
    
    // Mock fetch response with filtered results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        sites: [mockSites[1]], 
        total: 1 
      })
    });
    
    // Update filters
    await act(async () => {
      result.current.setFilters(newFilters);
      // fetchSites should be called with updated filters
      await result.current.fetchSites();
    });
    
    // Verify fetch was called with updated filters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=Another')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sortBy=updatedAt')
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sortOrder=desc')
    );
    
    // Filtered sites should be updated
    expect(result.current.sites.length).toBe(1);
    expect(result.current.sites[0].name).toBe('Another Site');
  });
});
