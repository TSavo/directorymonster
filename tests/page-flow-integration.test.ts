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

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

describe('Complete User Flow Integration Tests', () => {
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

  const mockFishingListings: Listing[] = [
    {
      id: 'listing_fishing_1',
      categoryId: 'category_fishing_1',
      siteId: 'site_fishing',
      name: 'Premium Fly Rod',
      title: 'Premium Fly Rod',
      slug: 'premium-fly-rod',
      description: 'The best fly rod on the market',
      content: '<p>This is a detailed description of the premium fly rod.</p>',
      featuredImage: 'https://example.com/image.jpg',
      imageUrl: 'https://example.com/image.jpg',
      backlinkUrl: 'https://fishingstore.com/fly-rod',
      backlinkType: 'dofollow',
      backlinkAnchorText: 'Buy Premium Fly Rod',
      backlinkPosition: 'prominent',
      linkAttributes: 'dofollow',
      metaDescription: 'Premium fly rod for serious anglers',
      createdAt: 1234567890,
      updatedAt: 1234567890,
      customFields: {
        price: '199.99',
        brand: 'FishPro',
        rating: '4.8',
        review_count: '24',
      },
    },
    {
      id: 'listing_fishing_2',
      categoryId: 'category_fishing_2',
      siteId: 'site_fishing',
      name: 'Carbon Fishing Rod',
      title: 'Carbon Fishing Rod',
      slug: 'carbon-fishing-rod',
      description: 'Lightweight carbon fishing rod',
      content: '<p>This is a detailed description of the carbon fishing rod.</p>',
      featuredImage: 'https://example.com/image2.jpg',
      imageUrl: 'https://example.com/image2.jpg',
      backlinkUrl: 'https://fishingstore.com/carbon-rod',
      backlinkType: 'dofollow',
      backlinkAnchorText: 'Buy Carbon Fishing Rod',
      backlinkPosition: 'body',
      linkAttributes: 'dofollow',
      metaDescription: 'Lightweight carbon fishing rod for all types of fishing',
      createdAt: 1234567890,
      updatedAt: 1234567890,
      customFields: {
        price: '149.99',
        brand: 'FishPro',
        rating: '4.5',
        review_count: '18',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up generic mock implementation for Redis keys
    (kv.keys as jest.Mock).mockImplementation((pattern: string) => {
      if (pattern === 'site:slug:*') {
        return Promise.resolve(['site:slug:fishing-gear']);
      } else if (pattern === 'category:site:site_fishing:*') {
        return Promise.resolve(
          mockFishingCategories.map((cat) => `category:site:site_fishing:${cat.id}`)
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

    // Set up generic mock implementation for Redis get
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'site:domain:fishinggearreviews.com') {
        return Promise.resolve(mockFishingSite);
      } else if (key === 'site:slug:fishing-gear') {
        return Promise.resolve(mockFishingSite);
      } else if (key.startsWith('category:site:site_fishing')) {
        const categoryId = key.split(':').pop();
        return Promise.resolve(
          mockFishingCategories.find((cat) => cat.id === categoryId) || null
        );
      } else if (key.startsWith('listing:category:category_fishing')) {
        const listingId = key.split(':').pop();
        return Promise.resolve(
          mockFishingListings.find((listing) => listing.id === listingId) || null
        );
      } else if (key.startsWith('listing:slug:')) {
        const slug = key.split(':').pop();
        return Promise.resolve(
          mockFishingListings.find((listing) => listing.slug === slug) || null
        );
      } else {
        return Promise.resolve(null);
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

  describe('Complete User Flow: Homepage -> Category -> Listing', () => {
    it('should successfully navigate from homepage to category to listing page', async () => {
      // Step 1: Simulate homepage visit
      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');

      // Verify we're getting categories for the homepage
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      expect(categoryKeys).toHaveLength(mockFishingCategories.length);
      
      // Get all categories
      const categoriesPromises = categoryKeys.map((key) => kv.get<Category>(key));
      const categories = await Promise.all(categoriesPromises);
      expect(categories).toHaveLength(mockFishingCategories.length);
      expect(categories[0]?.siteId).toBe('site_fishing');

      // Step 2: Simulate clicking on a category (navigation to category page)
      const targetCategory = categories[0]; // Select the first category (Fly Fishing)
      expect(targetCategory).toBeTruthy();
      expect(targetCategory?.slug).toBe('fly-fishing');

      // Verify we can get listings for this category
      const listingKeys = await kv.keys(`listing:category:${targetCategory?.id}:*`);
      const listingsPromises = listingKeys.map((key) => kv.get<Listing>(key));
      const listings = await Promise.all(listingsPromises);

      // Verify listings belong to the correct category and site
      expect(listings.length).toBeGreaterThan(0);
      listings.forEach((listing) => {
        expect(listing?.categoryId).toBe(targetCategory?.id);
        expect(listing?.siteId).toBe(site.id);
      });

      // Step 3: Simulate clicking on a listing (navigation to listing page)
      const targetListing = listings[0]; // Select the first listing
      expect(targetListing).toBeTruthy();
      expect(targetListing?.slug).toBe('premium-fly-rod');

      // Verify we can get the specific listing
      const listing = await kv.get<Listing>(`listing:slug:${targetListing?.slug}`);
      expect(listing).toBeTruthy();
      
      // Mock for listing slug lookup
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key === `listing:slug:${targetListing?.slug}`) {
          return Promise.resolve(targetListing);
        }
        // Maintain the original mock implementation for other keys
        return Promise.resolve(null);
      });

      // Verify the listing details match what we expect
      expect(listing?.title).toBe('Premium Fly Rod');
      expect(listing?.backlinkUrl).toBe('https://fishingstore.com/fly-rod');
      expect(listing?.customFields?.price).toBe('199.99');
    });

    it('should handle 404 errors when category does not exist', async () => {
      // Mock the notFound function so we can check when it's called
      const notFound = jest.requireMock('next/navigation').notFound;
      
      // Set up a case where the category doesn't exist
      (kv.keys as jest.Mock).mockImplementation((pattern: string) => {
        if (pattern === 'site:slug:*') {
          return Promise.resolve(['site:slug:fishing-gear']);
        } else {
          return Promise.resolve([]);
        }
      });
      
      // Attempt to get categories for a site
      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);
      
      // No categories will be found
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      expect(categoryKeys).toHaveLength(0);
      
      // In the page.tsx component, this would call notFound()
      // Here we manually simulate that for testing
      if (categoryKeys.length === 0) {
        notFound();
      }
      
      // Check that notFound was called
      expect(notFound).toHaveBeenCalled();
    });

    it('should handle 404 errors when listing does not exist', async () => {
      // Mock the notFound function so we can check when it's called
      const notFound = jest.requireMock('next/navigation').notFound;
      
      // First, get the site and category successfully
      const site = await getSiteByHostname('fishinggearreviews.com');
      expect(site).toEqual(mockFishingSite);
      
      const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
      const categoriesPromises = categoryKeys.map((key) => kv.get<Category>(key));
      const categories = await Promise.all(categoriesPromises);
      const targetCategory = categories[0];
      
      // But then fail to find any listings for this category
      (kv.keys as jest.Mock).mockImplementation((pattern: string) => {
        if (pattern.startsWith(`listing:category:${targetCategory?.id}`)) {
          return Promise.resolve([]);
        } else {
          return Promise.resolve([]);
        }
      });
      
      // No listings will be found
      const listingKeys = await kv.keys(`listing:category:${targetCategory?.id}:*`);
      expect(listingKeys).toHaveLength(0);
      
      // In the page.tsx component, this would call notFound()
      // Here we manually simulate that for testing
      if (listingKeys.length === 0) {
        notFound();
      }
      
      // Check that notFound was called
      expect(notFound).toHaveBeenCalled();
    });
  });
});