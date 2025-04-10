import React from 'react';
import { render } from '@testing-library/react';
import ListingCard from '../ListingCard';
import { ListingCardContainer } from '../ListingCardContainer';
import { Listing, SiteConfig } from '@/types';

// Mock the container component
jest.mock('../ListingCardContainer', () => ({
  ListingCardContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('ListingCard', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    expect(ListingCardContainer).toHaveBeenCalled();
  });

  it('passes listing and site to the container component', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    expect(ListingCardContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        listing: mockListing,
        site: mockSite
      }),
      expect.anything()
    );
  });
});
