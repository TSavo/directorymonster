import React from 'react';
import { render, screen } from '@testing-library/react';
import { ListingCardPresentation } from '../ListingCardPresentation';
import { Listing, SiteConfig } from '@/types';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} data-testid="mock-image" />;
  },
}));

// Mock the ListingLink component
jest.mock('../LinkUtilities', () => ({
  ListingLink: ({ children, listing, ...props }: any) => (
    <a href={`/${listing.categorySlug || 'category'}/${listing.slug}`} data-testid="mock-listing-link" {...props}>
      {children}
    </a>
  ),
}));

describe('ListingCardPresentation', () => {
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

  const defaultProps = {
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

  it('renders the listing card with all elements', () => {
    render(<ListingCardPresentation {...defaultProps} />);
    
    // Check if the card is rendered
    expect(screen.getByTestId('listing-card')).toBeInTheDocument();
    
    // Check if the image is rendered
    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
    
    // Check if the title is rendered
    expect(screen.getByTestId('listing-title')).toHaveTextContent('Test Listing');
    
    // Check if the category is rendered
    expect(screen.getByTestId('listing-category')).toHaveTextContent('Test Category');
    
    // Check if the rating is rendered
    expect(screen.getByTestId('listing-rating')).toBeInTheDocument();
    
    // Check if the description is rendered
    expect(screen.getByTestId('listing-description')).toHaveTextContent('Test listing description');
    
    // Check if the price is rendered
    expect(screen.getByTestId('listing-price')).toHaveTextContent('$99.99');
    
    // Check if the backlink is rendered
    expect(screen.getByTestId('listing-backlink')).toBeInTheDocument();
  });

  it('does not render image when hasImage is false', () => {
    render(<ListingCardPresentation {...defaultProps} hasImage={false} />);
    expect(screen.queryByTestId('mock-image')).not.toBeInTheDocument();
    expect(screen.getByTestId('listing-card')).toBeInTheDocument();
  });

  it('does not render rating when ratingValue is undefined', () => {
    render(<ListingCardPresentation {...defaultProps} ratingValue={undefined} />);
    expect(screen.queryByTestId('listing-rating')).not.toBeInTheDocument();
  });

  it('does not render category when hasCategory is false', () => {
    render(<ListingCardPresentation {...defaultProps} hasCategory={false} />);
    expect(screen.queryByTestId('listing-category')).not.toBeInTheDocument();
  });

  it('does not render price when hasPrice is false', () => {
    render(<ListingCardPresentation {...defaultProps} hasPrice={false} />);
    expect(screen.queryByTestId('listing-price')).not.toBeInTheDocument();
  });

  it('does not render backlink when hasProminentBacklink is false', () => {
    render(<ListingCardPresentation {...defaultProps} hasProminentBacklink={false} />);
    expect(screen.queryByTestId('listing-backlink')).not.toBeInTheDocument();
  });

  it('renders schema.org structured data', () => {
    render(<ListingCardPresentation {...defaultProps} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    
    if (script) {
      const jsonData = JSON.parse(script.innerHTML);
      expect(jsonData['@type']).toBe('Product');
      expect(jsonData.name).toBe('Test Listing');
      expect(jsonData.image).toBe('https://example.com/image.jpg');
      expect(jsonData.offers.price).toBe(99.99);
      expect(jsonData.aggregateRating.ratingValue).toBe(4.5);
    }
  });
});
