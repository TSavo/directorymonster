import { Listing, ListingStatus, validateListing } from '@/types/listing';

describe('Listing Type', () => {
  describe('ListingStatus enum', () => {
    it('should have the correct status values', () => {
      expect(ListingStatus.DRAFT).toBe('draft');
      expect(ListingStatus.PUBLISHED).toBe('published');
      expect(ListingStatus.ARCHIVED).toBe('archived');
      expect(ListingStatus.PENDING_REVIEW).toBe('pending_review');
      expect(ListingStatus.REJECTED).toBe('rejected');
    });
  });

  describe('validateListing', () => {
    it('should validate a valid listing', () => {
      const validListing: Listing = {
        id: 'listing-123',
        siteId: 'site-123',
        tenantId: 'tenant-123',
        title: 'Test Listing',
        slug: 'test-listing',
        description: 'This is a test listing',
        status: ListingStatus.PUBLISHED,
        categoryIds: ['cat-123'],
        media: [
          {
            id: 'media-1',
            url: 'https://example.com/image.jpg',
            type: 'image',
            isPrimary: true
          }
        ],
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateListing(validListing);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a listing without required fields', () => {
      const invalidListing = {
        id: 'listing-123',
        // Missing siteId
        tenantId: 'tenant-123',
        // Missing title
        slug: 'test-listing',
        description: 'This is a test listing',
        status: ListingStatus.PUBLISHED,
        // Missing categoryIds
        media: [],
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateListing(invalidListing as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('siteId is required');
      expect(result.errors).toContain('title is required');
      expect(result.errors).toContain('At least one categoryId is required');
    });

    it('should reject a listing with invalid status', () => {
      const invalidListing: Listing = {
        id: 'listing-123',
        siteId: 'site-123',
        tenantId: 'tenant-123',
        title: 'Test Listing',
        slug: 'test-listing',
        description: 'This is a test listing',
        status: 'invalid-status' as any,
        categoryIds: ['cat-123'],
        media: [],
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = validateListing(invalidListing);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('status must be one of: draft, published, archived, pending_review, rejected');
    });
  });
});
