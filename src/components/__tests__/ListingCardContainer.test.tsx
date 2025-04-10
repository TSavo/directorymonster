import React from 'react';
import { render } from '@testing-library/react';
import { ListingCardContainer } from '../ListingCardContainer';
import { useListingCard } from '../hooks/useListingCard';
import { ListingCardPresentation } from '../ListingCardPresentation';
import { Listing, SiteConfig } from '@/types';

// Mock the hook
jest.mock('../hooks/useListingCard');

// Mock the presentation component
jest.mock('../ListingCardPresentation', () => ({
  ListingCardPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('ListingCardContainer', () => {
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
    media: [],
    createdAt: '2023-01-01',
    updatedAt: '2023-01-02',
    userId: 'user-1'
  };

  const mockHookReturn = {
    listing: mockListing,
    site: mockSite,
    ratingValue: 4.5,
    reviewCount: '10',
    hasImage: true,
    isFeatured: true,
    hasCategory: true,
    hasPrice: true,
    hasProminentBacklink: true,
    hasBrand: true,
    hasSku: true,
    formattedPrice: '$99.99'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useListingCard as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('passes listing and site to the hook', () => {
    render(<ListingCardContainer listing={mockListing} site={mockSite} />);
    expect(useListingCard).toHaveBeenCalledWith({ listing: mockListing, site: mockSite });
  });

  it('passes hook results to the presentation component', () => {
    render(<ListingCardContainer listing={mockListing} site={mockSite} />);
    expect(ListingCardPresentation).toHaveBeenCalledWith(
      expect.objectContaining(mockHookReturn),
      expect.anything()
    );
  });
});
