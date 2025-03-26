import { getSiteByHostname } from '@/lib/site-utils';
import { SiteConfig, Category, Listing } from '@/types';
import { kv } from '@/lib/redis-client';
import { headers } from 'next/headers';

// Mock Redis
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('Page Rendering Tests', () => {
  // Mock data setup
  const mockFishingSite: SiteConfig = {
    id: 'site_fishing',
    name: 'Fishing Gear Reviews',
    slug: 'fishing-gear',
    domain: 'fishinggearreviews.com',
    primaryKeyword: 'fishing gear',
    metaDescription: 'Reviews of the best fishing gear',
    headerText: 'Fishing Gear Reviews',
    defaultLinkAttributes: 'dofollow',
    createdAt: 1234567890,
    updatedAt: 1234567890,
  };

  const mockHikingSite: SiteConfig = {
    id: 'site_hiking',
    name: 'Hiking Gear Directory',
    slug: 'hiking-gear',
    domain: 'hikinggearreviews.com',
    primaryKeyword: 'hiking gear',
    metaDescription: 'Directory of the best hiking gear',
    headerText: 'Hiking Gear Directory',
    defaultLinkAttributes: 'dofollow',
    createdAt: 1234567890,
    updatedAt: 1234567890,
  };

  const mockFishingCategories: Category[] = [
    {
      id: 'category_fishing_1',
      siteId: 'site_fishing',
      name: 'Fly Fishing',
      slug: 'fly-fishing',
      metaDescription: 'Fly fishing gear and equipment',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
    {
      id: 'category_fishing_2',
      siteId: 'site_fishing',
      name: 'Fishing Rods',
      slug: 'fishing-rods',
      metaDescription: 'Fishing rods for all types of fishing',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
  ];

  const mockHikingCategories: Category[] = [
    {
      id: 'category_hiking_1',
      siteId: 'site_hiking',
      name: 'Hiking Boots',
      slug: 'hiking-boots',
      metaDescription: 'Hiking boots for all types of terrain',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
    {
      id: 'category_hiking_2',
      siteId: 'site_hiking',
      name: 'Backpacks',
      slug: 'backpacks',
      metaDescription: 'Backpacks for hiking and camping',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
  ];

  const mockFishingListings: Listing[] = [
    {
      id: 'listing_fishing_1',
      categoryId: 'category_fishing_1',
      siteId: 'site_fishing',
      name: 'Premium Fly Rod',
      slug: 'premium-fly-rod',
      description: 'The best fly rod on the market',
      featuredImage: 'https://example.com/image.jpg',
      link: 'https://fishingstore.com/fly-rod',
      linkPosition: 'prominent',
      linkAttributes: 'dofollow',
      metaDescription: 'Premium fly rod for serious anglers',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
    {
      id: 'listing_fishing_2',
      categoryId: 'category_fishing_2',
      siteId: 'site_fishing',
      name: 'Carbon Fishing Rod',
      slug: 'carbon-fishing-rod',
      description: 'Lightweight carbon fishing rod',
      featuredImage: 'https://example.com/image2.jpg',
      link: 'https://fishingstore.com/carbon-rod',
      linkPosition: 'body',
      linkAttributes: 'dofollow',
      metaDescription: 'Lightweight carbon fishing rod for all types of fishing',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock implementation for site lookup
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'site:domain:fishinggearreviews.com') {
        return Promise.resolve(mockFishingSite);
      } else if (key === 'site:domain:hikinggearreviews.com') {
        return Promise.resolve(mockHikingSite);
      } else if (key === 'site:slug:fishing-gear') {
        return Promise.resolve(mockFishingSite);
      } else if (key === 'site:slug:hiking-gear') {
        return Promise.resolve(mockHikingSite);
      } else if (key.startsWith('category:site:site_fishing')) {
        const categoryId = key.split(':').pop();
        return Promise.resolve(
          mockFishingCategories.find((cat) => cat.id === categoryId) || null
        );
      } else if (key.startsWith('category:site:site_hiking')) {
        const categoryId = key.split(':').pop();
        return Promise.resolve(
          mockHikingCategories.find((cat) => cat.id === categoryId) || null
        );
      } else if (key.startsWith('listing:category:category_fishing')) {
        const listingId = key.split(':').pop();
        return Promise.resolve(
          mockFishingListings.find((listing) => listing.id === listingId) || null
        );
      } else {
        return Promise.resolve(null);
      }
    });

    // Set up mock implementation for keys method
    (kv.keys as jest.Mock).mockImplementation((pattern: string) => {
      if (pattern === 'site:slug:*') {
        return Promise.resolve(['site:slug:fishing-gear', 'site:slug:hiking-gear']);
      } else if (pattern === 'category:site:site_fishing:*') {
        return Promise.resolve(
          mockFishingCategories.map((cat) => `category:site:site_fishing:${cat.id}`)
        );
      } else if (pattern === 'category:site:site_hiking:*') {
        return Promise.resolve(
          mockHikingCategories.map((cat) => `category:site:site_hiking:${cat.id}`)
        );
      } else if (pattern.startsWith('listing:category:category_fishing')) {
        const categoryId = pattern.split(':')[2];
        return Promise.resolve(
          mockFishingListings
            .filter((listing) => listing.categoryId === categoryId)
            .map((listing) => `listing:category:${categoryId}:${listing.id}`)
        );
      } else {
        return Promise.resolve([]);
      }
    });

    // Setup mock headers
    (headers as jest.Mock).mockReturnValue({
      get: (key: string) => {
        if (key.toLowerCase() === 'host') {
          return 'fishinggearreviews.com';
        }
        return null;
      },
    });
  });

  describe('Site Hostname Resolution for Page Rendering', () => {
    it('should resolve site based on domain hostname for fishing site', async () => {
      // Simulate request to fishing domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'fishinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');
    });

    it('should resolve site based on domain hostname for hiking site', async () => {
      // Simulate request to hiking domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'hikinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('hikinggearreviews.com');
      expect(site).toEqual(mockHikingSite);
      expect(kv.get).toHaveBeenCalledWith('site:domain:hikinggearreviews.com');
    });

    it('should resolve site based on subdomain hostname', async () => {
      // First call for domain lookup returns null
      (kv.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockFishingSite);

      const site = await getSiteByHostname('fishing-gear.mydirectory.com');
      expect(site).toEqual(mockFishingSite);
      expect(kv.get).toHaveBeenNthCalledWith(1, 'site:domain:fishing-gear.mydirectory.com');
      expect(kv.get).toHaveBeenNthCalledWith(2, 'site:slug:fishing-gear');
    });

    it('should normalize hostname by removing port and protocol', async () => {
      const site = await getSiteByHostname('http://fishinggearreviews.com:3000');
      expect(site).toEqual(mockFishingSite);
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');
    });
  });

  describe('Homepage Rendering', () => {
    it('should retrieve categories for the correct site based on hostname', async () => {
      // Simulate request to fishing domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'fishinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);

      // Fetching categories for the site
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      expect(categoryKeys).toHaveLength(mockFishingCategories.length);

      // Verify we're getting categories for the correct site
      const categoriesPromises = categoryKeys.map((key) => kv.get<Category>(key));
      const categories = await Promise.all(categoriesPromises);
      expect(categories).toHaveLength(mockFishingCategories.length);
      expect(categories[0]?.siteId).toBe('site_fishing');
    });

    it('should retrieve different categories for a different site', async () => {
      // Simulate request to hiking domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'hikinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('hikinggearreviews.com');
      expect(site).toEqual(mockHikingSite);

      // Fetching categories for the site
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      expect(categoryKeys).toHaveLength(mockHikingCategories.length);

      // Verify we're getting categories for the correct site
      const categoriesPromises = categoryKeys.map((key) => kv.get<Category>(key));
      const categories = await Promise.all(categoriesPromises);
      expect(categories).toHaveLength(mockHikingCategories.length);
      expect(categories[0]?.siteId).toBe('site_hiking');
    });
  });

  describe('Category Page Rendering', () => {
    it('should retrieve listings for the correct category', async () => {
      // Simulate request to fishing domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'fishinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);

      // Fetching categories for the site
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      const categoriesPromises = categoryKeys.map((key) => kv.get<Category>(key));
      const categories = await Promise.all(categoriesPromises);

      // Choose the first category for testing
      const testCategory = categories[0];
      expect(testCategory).toBeTruthy();

      // Fetching listings for this category
      const listingKeys = await kv.keys(`listing:category:${testCategory?.id}:*`);
      const listingsPromises = listingKeys.map((key) => kv.get<Listing>(key));
      const listings = await Promise.all(listingsPromises);

      // Verify listings belong to the correct category and site
      expect(listings.length).toBeGreaterThan(0);
      listings.forEach((listing) => {
        expect(listing?.categoryId).toBe(testCategory?.id);
        expect(listing?.siteId).toBe(site.id);
      });
    });
  });

  describe('Listing Page Rendering', () => {
    it('should retrieve the correct listing details', async () => {
      // Simulate request to fishing domain
      (headers as jest.Mock).mockReturnValue({
        get: (key: string) => (key.toLowerCase() === 'host' ? 'fishinggearreviews.com' : null),
      });

      const site = await getSiteByHostname('fishinggearreviews.com');
      const testListing = mockFishingListings[0];

      // Mock get implementation for a specific listing
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key === `listing:slug:${testListing.slug}`) {
          return Promise.resolve(testListing);
        }
        // Keep original implementation for other keys
        return Promise.resolve(null);
      });

      // Verify the listing belongs to the correct site
      expect(testListing.siteId).toBe(site.id);
      expect(testListing.name).toBe('Premium Fly Rod');
      expect(testListing.linkPosition).toBe('prominent'); // Important for SEO tests
    });
  });
});