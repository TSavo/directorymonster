import { ListingService } from '@/services/ListingService';
import { kv } from '@/lib/redis-client';
import { Listing } from '@/types';

// Mock data
const mockListings: Listing[] = [
  {
    id: 'listing_1',
    siteId: 'site_1',
    title: 'Test Listing 1',
    slug: 'test-listing-1',
    categoryId: 'category_1',
    metaDescription: 'Test description 1',
    content: 'Test content 1',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'body',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: 1672531200000, // timestamp for 2023-01-01T00:00:00.000Z
    updatedAt: 1672531200000, // timestamp for 2023-01-01T00:00:00.000Z
  },
  {
    id: 'listing_2',
    siteId: 'site_1',
    title: 'Test Listing 2',
    slug: 'test-listing-2',
    categoryId: 'category_2',
    metaDescription: 'Test description 2',
    content: 'Test content 2',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'body',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: 1672617600000, // timestamp for 2023-01-02T00:00:00.000Z
    updatedAt: 1672617600000, // timestamp for 2023-01-02T00:00:00.000Z
  },
  {
    id: 'listing_3',
    siteId: 'site_1',
    title: 'Test Listing 3',
    slug: 'test-listing-3',
    categoryId: 'category_1',
    metaDescription: 'Test description 3',
    content: 'Test content 3',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'body',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: 1672704000000, // timestamp for 2023-01-03T00:00:00.000Z
    updatedAt: 1672704000000, // timestamp for 2023-01-03T00:00:00.000Z
  },
  {
    id: 'listing_4',
    siteId: 'site_1',
    title: 'Test Listing 4',
    slug: 'test-listing-4',
    categoryId: 'category_2',
    metaDescription: 'Test description 4',
    content: 'Test content 4',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'body',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: 1672790400000, // timestamp for 2023-01-04T00:00:00.000Z
    updatedAt: 1672790400000, // timestamp for 2023-01-04T00:00:00.000Z
  },
  {
    id: 'listing_5',
    siteId: 'site_2',
    title: 'Test Listing 5',
    slug: 'test-listing-5',
    categoryId: 'category_1',
    metaDescription: 'Test description 5',
    content: 'Test content 5',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example',
    backlinkPosition: 'body',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: 1672876800000, // timestamp for 2023-01-05T00:00:00.000Z
    updatedAt: 1672876800000, // timestamp for 2023-01-05T00:00:00.000Z
  }
];

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    keys: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    exists: jest.fn(),
  },
}));

describe('ListingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exist as a class', () => {
    // This is our first failing test - the class doesn't exist yet
    expect(ListingService).toBeDefined();
  });

  it('should get listings by site ID', async () => {
    // Mock the Redis client responses
    (kv.keys as jest.Mock).mockResolvedValue(['listing:site:site_1:1', 'listing:site:site_1:2']);
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'listing:site:site_1:1') return Promise.resolve(mockListings[0]);
      if (key === 'listing:site:site_1:2') return Promise.resolve(mockListings[1]);
      return Promise.resolve(null);
    });

    // Call the method
    const listings = await ListingService.getListingsBySiteId('site_1');

    // Verify the results
    expect(listings).toHaveLength(2);
    expect(listings[0].id).toBe('listing_1');
    expect(listings[1].id).toBe('listing_2');

    // Verify Redis client was called correctly
    expect(kv.keys).toHaveBeenCalledWith('listing:site:site_1:*');
    expect(kv.get).toHaveBeenCalledTimes(2);
  });

  it('should filter listings by category ID', async () => {
    // Mock the Redis client responses
    (kv.keys as jest.Mock).mockResolvedValue(['listing:site:site_1:1', 'listing:site:site_1:2']);
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'listing:site:site_1:1') return Promise.resolve(mockListings[0]);
      if (key === 'listing:site:site_1:2') return Promise.resolve(mockListings[1]);
      return Promise.resolve(null);
    });

    // Call the method with category filter
    const listings = await ListingService.getListingsBySiteId('site_1', { categoryId: 'category_1' });

    // Verify the results - should only include listings from category_1
    expect(listings).toHaveLength(1);
    expect(listings[0].id).toBe('listing_1');
    expect(listings[0].categoryId).toBe('category_1');

    // Verify Redis client was called correctly
    expect(kv.keys).toHaveBeenCalledWith('listing:site:site_1:*');
    expect(kv.get).toHaveBeenCalledTimes(2);
  });

  it('should paginate listings', async () => {
    // Mock the Redis client responses for multiple listings
    (kv.keys as jest.Mock).mockResolvedValue([
      'listing:site:site_1:1',
      'listing:site:site_1:2',
      'listing:site:site_1:3',
      'listing:site:site_1:4'
    ]);
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'listing:site:site_1:1') return Promise.resolve(mockListings[0]);
      if (key === 'listing:site:site_1:2') return Promise.resolve(mockListings[1]);
      if (key === 'listing:site:site_1:3') return Promise.resolve(mockListings[2]);
      if (key === 'listing:site:site_1:4') return Promise.resolve(mockListings[3]);
      return Promise.resolve(null);
    });

    // Call the method with pagination
    const paginatedListings = await ListingService.getListingsBySiteId('site_1', { page: 2, limit: 2 });

    // Verify the results - should return the second page (items 3-4)
    expect(paginatedListings.results).toHaveLength(2);
    expect(paginatedListings.results[0].id).toBe('listing_3');
    expect(paginatedListings.results[1].id).toBe('listing_4');

    // Verify pagination metadata
    expect(paginatedListings.pagination).toBeDefined();
    expect(paginatedListings.pagination.totalResults).toBe(4);
    expect(paginatedListings.pagination.totalPages).toBe(2);
    expect(paginatedListings.pagination.currentPage).toBe(2);
    expect(paginatedListings.pagination.limit).toBe(2);

    // Verify Redis client was called correctly
    expect(kv.keys).toHaveBeenCalledWith('listing:site:site_1:*');
    expect(kv.get).toHaveBeenCalledTimes(4);
  });
});
