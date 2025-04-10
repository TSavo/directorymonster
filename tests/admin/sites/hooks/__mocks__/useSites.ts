import { SiteData, SiteFilters, UseSitesReturn } from '@/components/admin/sites/hooks/useSites/types';

// Mock implementation of useSites hook for testing
export const useSites = jest.fn().mockImplementation((options = {}): UseSitesReturn => {
  const { initialData = {}, initialFilters = {} } = options;

  // Default mock implementation
  return {
    // Site data
    site: {
      name: '',
      slug: '',
      domains: [],
      theme: 'default',
      ...initialData
    },
    setSite: jest.fn(),
    updateSite: jest.fn(),
    resetSite: jest.fn(),

    // Form state
    isLoading: false,
    error: null,
    success: null,
    errors: {},
    resetErrors: jest.fn(),
    
    // Validation
    validateSite: jest.fn().mockReturnValue(true),
    
    // Site creation and updates
    createSite: jest.fn().mockResolvedValue(true),
    saveSite: jest.fn().mockResolvedValue(true),
    deleteSite: jest.fn().mockResolvedValue(true),
    
    // Multiple sites state
    sites: [],
    filteredSites: [],
    totalSites: 0,
    
    // Filtering and pagination
    filters: {
      search: '',
      status: 'all',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10,
      ...initialFilters
    },
    setFilters: jest.fn(),
    
    // Loading and fetching
    fetchSite: jest.fn().mockResolvedValue({}),
    fetchSites: jest.fn().mockResolvedValue([])
  };
});
