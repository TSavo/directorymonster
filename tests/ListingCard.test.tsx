/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingCard from '../src/components/ListingCard';
import { Listing, SiteConfig } from '../src/types';
import '@testing-library/jest-dom';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className, fill, sizes }: any) => (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      data-testid="mocked-image"
    />
  ),
}));

// Mock the LinkUtilities component
jest.mock('../src/components/LinkUtilities', () => ({
  ListingLink: ({ listing, className, children }: any) => (
    <a 
      href={`/mock-category/${listing.categorySlug}/mock-listing/${listing.slug}`} 
      className={className}
      data-testid="mocked-listing-link"
    >
      {children}
    </a>
  ),
}));

describe('ListingCard Component', () => {
  // Define test data
  const mockSite: SiteConfig = {
    id: 'site1',
    name: 'Test Site',
    slug: 'test-site',
    primaryKeyword: 'test',
    metaDescription: 'Test site description',
    headerText: 'Test Site Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockListing: Listing = {
    id: 'list1',
    siteId: 'site1',
    categoryId: 'cat1',
    categorySlug: 'test-category',
    title: 'Test Product',
    slug: 'test-product',
    metaDescription: 'This is a test product description',
    content: 'Full content here',
    imageUrl: '/images/test-product.jpg',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Visit Official Site',
    backlinkPosition: 'prominent',
    backlinkType: 'dofollow',
    customFields: {
      rating: '4.5',
      review_count: '42',
      price: '99.99',
      brand: 'Test Brand',
      sku: 'TEST123'
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  it('renders listing title and description correctly', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product description')).toBeInTheDocument();
  });

  it('renders the image when imageUrl is provided', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const image = screen.getByTestId('mocked-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/test-product.jpg');
    expect(image).toHaveAttribute('alt', 'Test Product');
  });

  it('does not render an image when imageUrl is not provided', () => {
    const listingWithoutImage = { ...mockListing, imageUrl: undefined };
    render(<ListingCard listing={listingWithoutImage} site={mockSite} />);
    
    const image = screen.queryByTestId('mocked-image');
    expect(image).not.toBeInTheDocument();
  });

  it('renders rating stars correctly', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    // Should have 5 stars (the rating is 4.5)
    const stars = document.querySelectorAll('svg');
    expect(stars.length).toBe(5);
    
    // Check that review count is displayed
    expect(screen.getByText('(42 reviews)')).toBeInTheDocument();
    
    // Check rating metadata
    const ratingValue = document.querySelector('meta[itemprop="ratingValue"]');
    expect(ratingValue).toHaveAttribute('content', '4.5');
    
    const reviewCount = document.querySelector('meta[itemprop="reviewCount"]');
    expect(reviewCount).toHaveAttribute('content', '42');
  });

  it('does not render rating stars when rating is not provided', () => {
    const listingWithoutRating = { 
      ...mockListing, 
      customFields: { ...mockListing.customFields, rating: undefined } 
    };
    render(<ListingCard listing={listingWithoutRating} site={mockSite} />);
    
    const stars = document.querySelectorAll('svg');
    expect(stars.length).toBe(0);
    
    const ratingDiv = document.querySelector('[itemProp="aggregateRating"]');
    expect(ratingDiv).not.toBeInTheDocument();
  });

  it('renders price when available', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    
    // Check price metadata
    const price = document.querySelector('meta[itemprop="price"]');
    expect(price).toHaveAttribute('content', '99.99');
    
    const currency = document.querySelector('meta[itemprop="priceCurrency"]');
    expect(currency).toHaveAttribute('content', 'USD');
  });

  it('does not render price when not available', () => {
    const listingWithoutPrice = { 
      ...mockListing, 
      customFields: { ...mockListing.customFields, price: undefined } 
    };
    render(<ListingCard listing={listingWithoutPrice} site={mockSite} />);
    
    const priceElement = document.querySelector('[itemProp="offers"]');
    expect(priceElement).not.toBeInTheDocument();
  });

  it('renders prominent backlink when backlinkPosition is "prominent"', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const backlink = screen.getByText('Visit Official Site');
    expect(backlink).toBeInTheDocument();
    expect(backlink).toHaveAttribute('href', 'https://example.com');
    expect(backlink.closest('div')).toHaveClass('mt-3 pt-3 border-t border-gray-100');
  });

  it('does not render prominent backlink when backlinkPosition is not "prominent"', () => {
    const listingWithNonProminentBacklink = { 
      ...mockListing, 
      backlinkPosition: 'footer' as const
    };
    render(<ListingCard listing={listingWithNonProminentBacklink} site={mockSite} />);
    
    const backlink = screen.queryByText('Visit Official Site');
    expect(backlink).not.toBeInTheDocument();
  });

  it('adds proper rel attribute for nofollow backlinks', () => {
    const listingWithNofollowBacklink = { 
      ...mockListing, 
      backlinkType: 'nofollow' as const
    };
    render(<ListingCard listing={listingWithNofollowBacklink} site={mockSite} />);
    
    const backlink = screen.getByText('Visit Official Site');
    expect(backlink).toHaveAttribute('rel', 'nofollow');
  });

  it('does not add rel attribute for dofollow backlinks', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const backlink = screen.getByText('Visit Official Site');
    expect(backlink).not.toHaveAttribute('rel', 'nofollow');
  });

  it('renders additional metadata when available', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const brand = document.querySelector('meta[itemprop="brand"]');
    expect(brand).toHaveAttribute('content', 'Test Brand');
    
    const sku = document.querySelector('meta[itemprop="sku"]');
    expect(sku).toHaveAttribute('content', 'TEST123');
  });

  it('includes correct Schema.org markup', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const productSchema = document.querySelector('[itemType="https://schema.org/Product"]');
    expect(productSchema).toBeInTheDocument();
    
    const ratingSchema = document.querySelector('[itemType="https://schema.org/AggregateRating"]');
    expect(ratingSchema).toBeInTheDocument();
    
    const offerSchema = document.querySelector('[itemType="https://schema.org/Offer"]');
    expect(offerSchema).toBeInTheDocument();
  });

  it('renders "View Details" link correctly', () => {
    render(<ListingCard listing={mockListing} site={mockSite} />);
    
    const viewDetailsLink = screen.getByText('View Details →');
    expect(viewDetailsLink).toBeInTheDocument();
    expect(viewDetailsLink.closest('a')).toHaveAttribute(
      'href', 
      '/mock-category/test-category/mock-listing/test-product'
    );
  });
});
