import { NextRequest } from 'next/server';
import { Listing, SiteConfig, Category } from '@/types';

// We'll need to import the route handler after mocking the services
let GET: any;
let ListingService: any;
let SiteService: any;
let CategoryService: any;

describe('GET /api/sites/[siteSlug]/listings (Service-based)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset modules to ensure clean imports with mocks applied
    jest.resetModules();

    // Mock the services
    jest.doMock('@/services/ListingService', () => ({
      ListingService: {
        getListingsBySiteId: jest.fn(),
        createListing: jest.fn(),
      },
    }));

    jest.doMock('@/services/SiteService', () => ({
      SiteService: {
        getSiteBySlug: jest.fn(),
      },
    }));

    jest.doMock('@/services/CategoryService', () => ({
      CategoryService: {
        getCategoryBySlug: jest.fn(),
      },
    }));

    // Import the mocks and route handler
    const listingServiceModule = require('@/services/ListingService');
    const siteServiceModule = require('@/services/SiteService');
    const categoryServiceModule = require('@/services/CategoryService');
    const routeModule = require('@/app/api/sites/[siteSlug]/listings/route');

    ListingService = listingServiceModule.ListingService;
    SiteService = siteServiceModule.SiteService;
    CategoryService = categoryServiceModule.CategoryService;
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

  it('should create a new listing', async () => {
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

    // Mock category data
    const mockCategory: Category = {
      id: 'category_1',
      siteId: 'site_1',
      name: 'Test Category',
      slug: 'test-category',
      metaDescription: 'Test category description',
      parentId: null,
      order: 1,
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock listing data
    const mockListing: Listing = {
      id: 'listing_1234567890',
      siteId: 'site_1',
      title: 'New Test Listing',
      slug: 'new-test-listing',
      categoryId: 'category_1',
      metaDescription: 'New test description',
      content: 'New test content',
      backlinkUrl: 'https://example.com',
      backlinkAnchorText: 'Example Link',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock request data
    const requestData = {
      title: 'New Test Listing',
      categoryId: 'category_1',
      metaDescription: 'New test description',
      content: 'New test content',
      backlinkUrl: 'https://example.com',
      backlinkAnchorText: 'Example Link',
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.createListing as jest.Mock).mockResolvedValue(mockListing);
    (CategoryService.getCategoryBySlug as jest.Mock).mockResolvedValue(mockCategory);

    // Create request
    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/listings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    // Mock request.json()
    request.json = jest.fn().mockResolvedValue(requestData);

    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('listing_1234567890');
    expect(data.title).toBe('New Test Listing');
    expect(data.url).toBe('https://test.com/test-category/new-test-listing');

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.createListing).toHaveBeenCalledWith('site_1', requestData);
    expect(CategoryService.getCategoryBySlug).toHaveBeenCalledWith('site_1', 'category_1');
  });

  it('should return 400 when required fields are missing', async () => {
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

    // Mock request data with missing fields
    const requestData = {
      title: 'New Test Listing',
      // Missing categoryId
      metaDescription: 'New test description',
      // Missing content
      // Missing backlinkUrl
    };

    // Mock service responses
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);

    // Create request
    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/listings',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    // Mock request.json()
    request.json = jest.fn().mockResolvedValue(requestData);

    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Missing required fields' });

    // Verify services were called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.createListing).not.toHaveBeenCalled();
  });
});
