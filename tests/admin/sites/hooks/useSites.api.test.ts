/**
 * @jest-environment jsdom
 */
import { 
  fetchSite, 
  fetchSites, 
  createSite, 
  updateSite, 
  deleteSite 
} from '@/components/admin/sites/hooks/useSites/api';
import { SiteData, SiteFilters } from '@/components/admin/sites/hooks/useSites/types';

// Mock site data
const mockSite: SiteData = {
  id: 'site-1',
  name: 'Test Site',
  slug: 'test-site',
  description: 'A test site',
  domains: ['example.com'],
  theme: 'default'
};

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

// Mock fetch
global.fetch = jest.fn();

describe('Site API Functions - fetchSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches a single site successfully', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSite
    });

    const result = await fetchSite('/api/sites', 'site-1');

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1');
    
    // Verify result
    expect(result).toEqual(mockSite);
  });

  it('handles fetch errors gracefully', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Site not found' })
    });

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await fetchSite('/api/sites', 'nonexistent-site');

    // Verify result is null on error
    expect(result).toBeNull();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await fetchSite('/api/sites', 'site-1');

    // Verify result is null on error
    expect(result).toBeNull();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});

describe('Site API Functions - fetchSites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all sites with no filters', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: mockSites, total: mockSites.length })
    });

    const result = await fetchSites('/api/sites', {});

    // Verify fetch was called with correct URL (no query params)
    expect(global.fetch).toHaveBeenCalledWith('/api/sites');
    
    // Verify result contains sites and total
    expect(result.sites).toEqual(mockSites);
    expect(result.total).toBe(mockSites.length);
  });

  it('applies filters to the query string', async () => {
    // Setup filters
    const filters: SiteFilters = {
      search: 'test',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 2,
      limit: 10
    };

    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sites: [mockSite], total: 1 })
    });

    const result = await fetchSites('/api/sites', filters);

    // Verify fetch was called with correct query params
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/sites\?.*search=test.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/.*sortBy=name.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/.*sortOrder=asc.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/.*page=2.*/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/.*limit=10.*/)
    );
    
    // Verify filtered results
    expect(result.sites).toEqual([mockSite]);
    expect(result.total).toBe(1);
  });

  it('handles API errors when fetching sites', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' })
    });

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await fetchSites('/api/sites', {});

    // Verify empty results on error
    expect(result.sites).toEqual([]);
    expect(result.total).toBe(0);
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles empty or missing response data', async () => {
    // Mock response with missing data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const result = await fetchSites('/api/sites', {});

    // Should handle missing data gracefully
    expect(result.sites).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe('Site API Functions - createSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a site successfully', async () => {
    // New site data without ID
    const newSite: SiteData = {
      name: 'New Site',
      slug: 'new-site',
      domains: ['newsite.com'],
      theme: 'default'
    };

    // Expected response with ID added
    const createdSite = {
      ...newSite,
      id: 'new-site-id'
    };

    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdSite
    });

    const result = await createSite('/api/sites', newSite);

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSite)
    });
    
    // Verify successful result
    expect(result.success).toBe(true);
    expect(result.data).toEqual(createdSite);
  });

  it('handles API errors during creation', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Validation failed' })
    });

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await createSite('/api/sites', mockSite);

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles network errors during creation', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await createSite('/api/sites', mockSite);

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});

describe('Site API Functions - updateSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a site successfully', async () => {
    // Updated site data
    const updatedSite: SiteData = {
      ...mockSite,
      name: 'Updated Site Name'
    };

    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedSite
    });

    const result = await updateSite('/api/sites', 'site-1', updatedSite);

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedSite)
    });
    
    // Verify successful result
    expect(result.success).toBe(true);
    expect(result.data).toEqual(updatedSite);
  });

  it('handles API errors during update', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Site not found' })
    });

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await updateSite('/api/sites', 'nonexistent-site', mockSite);

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles network errors during update', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await updateSite('/api/sites', 'site-1', mockSite);

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});

describe('Site API Functions - deleteSite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes a site successfully', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const result = await deleteSite('/api/sites', 'site-1');

    // Verify fetch was called correctly
    expect(global.fetch).toHaveBeenCalledWith('/api/sites/site-1', {
      method: 'DELETE'
    });
    
    // Verify successful result
    expect(result.success).toBe(true);
  });

  it('handles API errors during deletion', async () => {
    // Mock failed response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Permission denied' })
    });

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await deleteSite('/api/sites', 'site-1');

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles network errors during deletion', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Mock console.error to avoid test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    const result = await deleteSite('/api/sites', 'site-1');

    // Verify failed result
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Error should be logged
    expect(console.error).toHaveBeenCalled();
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});
