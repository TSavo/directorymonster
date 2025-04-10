import { renderHook } from '@testing-library/react';
import { useListingCard } from '../useListingCard';
import { Listing, SiteConfig } from '@/types';

describe('useListingCard', () => {
  const mockSite: SiteConfig = {
    id: 'site-1',
    name: 'Test Site',
    slug: 'test-site',
    primaryKeyword: 'test',
    metaDescription: 'Test site description',
    headerText: 'Test Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: 1234567890,
    updatedAt: 1234567890
  };

  const mockListing: Listing = {
    id: 'listing-1',
    siteId: 'site-1',
    tenantId: 'tenant-1',
    title: 'Test Listing',
    slug: 'test-listing',
    description: 'Test listing description',
    status: 'published',
    categoryIds: ['cat-1'],
    categoryName: 'Test Category',
    media: [],
    imageUrl: 'https://example.com/image.jpg',
    customFields: {
      rating: 4.5,
      review_count: 10,
      featured: true,
      price: 99.99,
      brand: 'Test Brand',
      sku: 'TEST-123'
    },
    backlinkPosition: 'prominent',
    backlinkUrl: 'https://example.com',
    backlinkText: 'Visit Website',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-02',
    userId: 'user-1'
  };

  it('initializes with the correct listing and site', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.listing).toEqual(mockListing);
    expect(result.current.site).toEqual(mockSite);
  });

  it('extracts rating value correctly', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.ratingValue).toBe(4.5);
  });

  it('returns undefined for rating when not available', () => {
    const listingWithoutRating = { ...mockListing, customFields: {} };
    const { result } = renderHook(() => useListingCard({ listing: listingWithoutRating, site: mockSite }));
    expect(result.current.ratingValue).toBeUndefined();
  });

  it('extracts review count correctly', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.reviewCount).toBe('10');
  });

  it('defaults review count to "1" when not available', () => {
    const listingWithoutReviews = { ...mockListing, customFields: { rating: 4.5 } };
    const { result } = renderHook(() => useListingCard({ listing: listingWithoutReviews, site: mockSite }));
    expect(result.current.reviewCount).toBe('1');
  });

  it('detects image presence correctly', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.hasImage).toBe(true);

    const listingWithoutImage = { ...mockListing, imageUrl: undefined };
    const { result: resultWithoutImage } = renderHook(() => useListingCard({ listing: listingWithoutImage, site: mockSite }));
    expect(resultWithoutImage.current.hasImage).toBe(false);
  });

  it('detects featured status correctly', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.isFeatured).toBe(true);

    const listingNotFeatured = { ...mockListing, customFields: { ...mockListing.customFields, featured: false } };
    const { result: resultNotFeatured } = renderHook(() => useListingCard({ listing: listingNotFeatured, site: mockSite }));
    expect(resultNotFeatured.current.isFeatured).toBe(false);
  });

  it('formats price correctly', () => {
    const { result } = renderHook(() => useListingCard({ listing: mockListing, site: mockSite }));
    expect(result.current.formattedPrice).toBe('$99.99');

    const listingWithoutPrice = { ...mockListing, customFields: { rating: 4.5 } };
    const { result: resultWithoutPrice } = renderHook(() => useListingCard({ listing: listingWithoutPrice, site: mockSite }));
    expect(resultWithoutPrice.current.formattedPrice).toBe('');
  });
});
