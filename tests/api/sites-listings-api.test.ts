import { NextRequest } from 'next/server';
import { Listing, SiteConfig } from '@/types';

// We'll need to import the route handler after mocking the services
let GET: any;
let ListingService: any;
let SiteService: any;

describe('GET /api/sites/[siteSlug]/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset modules to ensure clean imports with mocks applied
    jest.resetModules();

    // Mock the services
    jest.doMock('@/services/ListingService', () => ({
      ListingService: {
        getListingsBySiteId: jest.fn(),
      },
    }));

    jest.doMock('@/services/SiteService', () => ({
      SiteService: {
        getSiteBySlug: jest.fn(),
      },
    }));

    // Import the mocks and route handler
    const listingServiceModule = require('@/services/ListingService');
    const siteServiceModule = require('@/services/SiteService');
    const routeModule = require('@/app/api/sites/[siteSlug]/listings/route-service');

    ListingService = listingServiceModule.ListingService;
    SiteService = siteServiceModule.SiteService;
    GET = routeModule.GET;
  });

  it('should return 404 when site is not found', async () => {
    // Mock SiteService to return null (site not found)
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'non-existent' } });

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });

    // Verify SiteService was called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('non-existent');
    expect(ListingService.getListingsBySiteId).not.toHaveBeenCalled();
  });

  it('should return listings for a site', async () => {
    // Mock site data
    const mockSite: SiteConfig = {
      id: 'site_1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test.com',
      tenantId: 'tenant_1',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock listings data with pagination
    const mockPaginatedListings = {
      results: [
        {
          id: 'listing_1',
          siteId: 'site_1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
          categoryId: 'category_1',
          metaDescription: 'Test description 1',
          content: 'Test content 1',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        {
          id: 'listing_2',
          siteId: 'site_1',
          title: 'Test Listing 2',
          slug: 'test-listing-2',
          categoryId: 'category_2',
          metaDescription: 'Test description 2',
          content: 'Test content 2',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ],
      pagination: {
        totalResults: 2,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      },
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.getListingsBySiteId as jest.Mock).mockResolvedValue(mockPaginatedListings);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.totalResults).toBe(2);

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.getListingsBySiteId).toHaveBeenCalledWith('site_1', {
      categoryId: undefined,
      page: undefined,
      limit: undefined,
    });
  });

  it('should filter listings by category', async () => {
    // Mock site data
    const mockSite: SiteConfig = {
      id: 'site_1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test.com',
      tenantId: 'tenant_1',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock filtered listings data
    const mockFilteredListings = {
      results: [
        {
          id: 'listing_1',
          siteId: 'site_1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
          categoryId: 'category_1',
          metaDescription: 'Test description 1',
          content: 'Test content 1',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ],
      pagination: {
        totalResults: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 10,
      },
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.getListingsBySiteId as jest.Mock).mockResolvedValue(mockFilteredListings);

    // Create request with category filter
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings?categoryId=category_1');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].categoryId).toBe('category_1');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.totalResults).toBe(1);

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.getListingsBySiteId).toHaveBeenCalledWith('site_1', {
      categoryId: 'category_1',
      page: undefined,
      limit: undefined,
    });
  });

  it('should paginate listings', async () => {
    // Mock site data
    const mockSite: SiteConfig = {
      id: 'site_1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test.com',
      tenantId: 'tenant_1',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock paginated listings data (page 2 with 2 items per page)
    const mockPaginatedListings = {
      results: [
        {
          id: 'listing_3',
          siteId: 'site_1',
          title: 'Test Listing 3',
          slug: 'test-listing-3',
          categoryId: 'category_1',
          metaDescription: 'Test description 3',
          content: 'Test content 3',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        {
          id: 'listing_4',
          siteId: 'site_1',
          title: 'Test Listing 4',
          slug: 'test-listing-4',
          categoryId: 'category_2',
          metaDescription: 'Test description 4',
          content: 'Test content 4',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ],
      pagination: {
        totalResults: 4,
        totalPages: 2,
        currentPage: 2,
        limit: 2,
      },
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.getListingsBySiteId as jest.Mock).mockResolvedValue(mockPaginatedListings);

    // Create request with pagination parameters
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings?page=2&limit=2');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.results[0].id).toBe('listing_3');
    expect(data.results[1].id).toBe('listing_4');
    expect(data.pagination).toBeDefined();
    expect(data.pagination.totalResults).toBe(4);
    expect(data.pagination.currentPage).toBe(2);
    expect(data.pagination.limit).toBe(2);

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.getListingsBySiteId).toHaveBeenCalledWith('site_1', {
      categoryId: undefined,
      page: 2,
      limit: 2,
    });
  });

  it('should handle service errors gracefully', async () => {
    // Mock site data
    const mockSite: SiteConfig = {
      id: 'site_1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test.com',
      tenantId: 'tenant_1',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.getListingsBySiteId as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Spy on console.error to verify it's called
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch listings' });

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.getListingsBySiteId).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
