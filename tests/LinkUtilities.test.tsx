/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CategoryLink, ListingLink, ListingLinkWithCategory } from '../src/components/LinkUtilities';
import { Category, Listing } from '../src/types';
import '@testing-library/jest-dom';

// Mock the site-utils module
jest.mock('../src/lib/site-utils', () => ({
  generateCategoryHref: (slug: string) => `/mock-category/${slug}`,
  generateListingHref: (categorySlug: string, listingSlug: string) => 
    `/mock-category/${categorySlug}/mock-listing/${listingSlug}`,
}));

// Test data
const category: Category = {
  id: 'cat1',
  siteId: 'site1',
  name: 'Test Category',
  slug: 'test-category',
  metaDescription: 'A test category',
  order: 1,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const listing: Listing = {
  id: 'list1',
  siteId: 'site1',
  categoryId: 'cat1',
  categorySlug: 'test-category',
  title: 'Test Listing',
  slug: 'test-listing',
  metaDescription: 'A test listing',
  content: 'Test content',
  backlinkUrl: 'https://example.com',
  backlinkAnchorText: 'Example',
  backlinkPosition: 'footer',
  backlinkType: 'dofollow',
  customFields: {},
  createdAt: Date.now(),
  updatedAt: Date.now()
};

describe('Link Utility Components', () => {
  describe('CategoryLink', () => {
    it('renders with the correct href and children', () => {
      render(
        <CategoryLink category={category} className="test-class">
          Category Text
        </CategoryLink>
      );
      
      const link = screen.getByText('Category Text');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute('href', '/mock-category/test-category');
      expect(link.closest('a')).toHaveClass('test-class');
    });
    
    it('works with minimal category object containing only slug', () => {
      render(
        <CategoryLink category={{ slug: 'minimal-slug' }}>
          Minimal Category
        </CategoryLink>
      );
      
      const link = screen.getByText('Minimal Category');
      expect(link.closest('a')).toHaveAttribute('href', '/mock-category/minimal-slug');
    });
  });
  
  describe('ListingLink', () => {
    it('renders with the correct href and children', () => {
      render(
        <ListingLink listing={listing} className="test-class">
          Listing Text
        </ListingLink>
      );
      
      const link = screen.getByText('Listing Text');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute(
        'href', 
        '/mock-category/test-category/mock-listing/test-listing'
      );
      expect(link.closest('a')).toHaveClass('test-class');
    });
    
    it('falls back to categoryId when categorySlug is not available', () => {
      const listingWithoutSlug = { ...listing, categorySlug: undefined };
      
      render(
        <ListingLink listing={listingWithoutSlug}>
          Fallback Listing
        </ListingLink>
      );
      
      const link = screen.getByText('Fallback Listing');
      expect(link.closest('a')).toHaveAttribute(
        'href', 
        '/mock-category/cat1/mock-listing/test-listing'
      );
    });
  });
  
  describe('ListingLinkWithCategory', () => {
    it('renders with the correct href and children', () => {
      render(
        <ListingLinkWithCategory 
          categorySlug="explicit-category" 
          listingSlug="explicit-listing"
          className="test-class"
        >
          Direct Link
        </ListingLinkWithCategory>
      );
      
      const link = screen.getByText('Direct Link');
      expect(link).toBeInTheDocument();
      expect(link.closest('a')).toHaveAttribute(
        'href', 
        '/mock-category/explicit-category/mock-listing/explicit-listing'
      );
      expect(link.closest('a')).toHaveClass('test-class');
    });
  });
  
  describe('Additional props forwarding', () => {
    it('forwards additional props to the underlying link', () => {
      render(
        <CategoryLink 
          category={category} 
          data-testid="test-link"
          aria-label="Test Link"
          target="_blank"
        >
          Props Test
        </CategoryLink>
      );
      
      const link = screen.getByTestId('test-link');
      expect(link).toHaveAttribute('aria-label', 'Test Link');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});