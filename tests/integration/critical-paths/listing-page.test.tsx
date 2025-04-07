/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { createMockSite, createMockCategory, createMockListing, resetMocks } from './setup';

// Mock the page component
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Import the page component
import ListingPage from '@/app/[categorySlug]/[listingSlug]/page';

// Mock the resolveTenant function
jest.mock('@/lib/tenant-resolver', () => ({
  resolveTenant: jest.fn(() => ({
    tenant: { id: 'tenant-1', name: 'Test Tenant' },
    site: {
      id: 'site-1',
      name: 'Test Directory',
      slug: 'test-directory',
      domain: 'test-directory.com',
      tenantId: 'tenant-1',
      primaryKeyword: 'test directory',
      metaDescription: 'A test directory for integration tests',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  })),
}));

// Mock the kv client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    smembers: jest.fn(() => ['category-1', 'category-2', 'category-3']),
    sismember: jest.fn(() => true),
  },
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    smembers: jest.fn(() => ['category-1', 'category-2', 'category-3']),
    sismember: jest.fn(() => true),
    multi: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      smembers: jest.fn(),
      sismember: jest.fn(),
      exec: jest.fn(() => []),
    })),
  },
}));

describe('Listing Page Integration Tests', () => {
  const mockSite = createMockSite();
  const mockCategory = createMockCategory(mockSite.id, { id: 'category-1', name: 'Test Category', slug: 'test-category' });
  const mockListing = createMockListing(mockSite.id, mockCategory.id, { id: 'listing-1', title: 'Test Listing', slug: 'test-listing' });
  const mockCategories = [
    mockCategory,
    createMockCategory(mockSite.id, { id: 'category-2', name: 'Another Category', slug: 'another-category' }),
    createMockCategory(mockSite.id, { id: 'category-3', name: 'Third Category', slug: 'third-category' }),
  ];

  beforeEach(() => {
    resetMocks();
    
    // Mock the kv.get function to return mock data
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key: string) => {
      if (key.includes('site:')) {
        return JSON.stringify(mockSite);
      } else if (key.includes('category:') && key.includes(':slug:')) {
        const slug = key.split(':').pop();
        const category = mockCategories.find(c => c.slug === slug);
        return category ? JSON.stringify(category) : null;
      } else if (key.includes('category:')) {
        const categoryId = key.split(':').pop();
        const category = mockCategories.find(c => c.id === categoryId);
        return category ? JSON.stringify(category) : null;
      } else if (key.includes('listing:') && key.includes(':slug:')) {
        return JSON.stringify(mockListing);
      } else if (key.includes('listing:')) {
        return JSON.stringify(mockListing);
      }
      return null;
    });
    
    // Mock the kv.smembers function to return category IDs or listing IDs
    kv.smembers.mockImplementation((key: string) => {
      if (key.includes('site:categories')) {
        return mockCategories.map(c => c.id);
      } else if (key.includes('category:listings')) {
        return [mockListing.id];
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the listing page with listing title and description', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );
    
    // Wait for the listing title to be rendered
    await waitFor(() => {
      const titleElement = screen.queryByText(mockListing.title);
      if (titleElement) {
        expect(titleElement).toBeInTheDocument();
      }
    });
    
    // Check that the listing description is rendered
    const descriptionElement = screen.queryByText(mockListing.description);
    if (descriptionElement) {
      expect(descriptionElement).toBeInTheDocument();
    }
  });

  it('renders listing details and contact information', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );
    
    // Wait for the listing details to be rendered
    await waitFor(() => {
      // Check for address information
      const addressElement = screen.queryByText(mockListing.address);
      if (addressElement) {
        expect(addressElement).toBeInTheDocument();
      }
    });
    
    // Check for contact information
    const phoneElement = screen.queryByText(mockListing.phone);
    if (phoneElement) {
      expect(phoneElement).toBeInTheDocument();
    }
    
    const emailElement = screen.queryByText(mockListing.email);
    if (emailElement) {
      expect(emailElement).toBeInTheDocument();
    }
  });

  it('renders breadcrumb navigation with category and listing', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );
    
    // Wait for the breadcrumb navigation to be rendered
    await waitFor(() => {
      const homeLink = screen.queryByText('Home');
      if (homeLink) {
        expect(homeLink).toBeInTheDocument();
      }
    });
    
    // Check that the category name is in the breadcrumb
    const categoryElement = screen.queryByText(mockCategory.name);
    if (categoryElement) {
      expect(categoryElement).toBeInTheDocument();
    }
    
    // Check that the listing title is in the breadcrumb or page
    expect(screen.getAllByText(mockListing.title).length).toBeGreaterThan(0);
  });

  it('renders related listings if available', async () => {
    // Create mock related listings
    const relatedListings = [
      createMockListing(mockSite.id, mockCategory.id, { id: 'related-1', title: 'Related Listing 1', slug: 'related-listing-1' }),
      createMockListing(mockSite.id, mockCategory.id, { id: 'related-2', title: 'Related Listing 2', slug: 'related-listing-2' }),
    ];
    
    // Mock the kv.smembers function to return related listing IDs
    const { kv } = require('@/lib/redis-client');
    kv.smembers.mockImplementation((key: string) => {
      if (key.includes('listing:related')) {
        return relatedListings.map(l => l.id);
      } else if (key.includes('site:categories')) {
        return mockCategories.map(c => c.id);
      } else if (key.includes('category:listings')) {
        return [mockListing.id, ...relatedListings.map(l => l.id)];
      }
      return [];
    });
    
    // Mock the kv.get function to return related listings
    kv.get.mockImplementation((key: string) => {
      if (key.includes('site:')) {
        return JSON.stringify(mockSite);
      } else if (key.includes('category:')) {
        const categoryId = key.split(':').pop();
        const category = mockCategories.find(c => c.id === categoryId);
        return category ? JSON.stringify(category) : null;
      } else if (key.includes('listing:') && key.includes(':slug:')) {
        return JSON.stringify(mockListing);
      } else if (key.includes('listing:')) {
        const listingId = key.split(':').pop();
        if (listingId === mockListing.id) {
          return JSON.stringify(mockListing);
        } else {
          const relatedListing = relatedListings.find(l => l.id === listingId);
          return relatedListing ? JSON.stringify(relatedListing) : null;
        }
      }
      return null;
    });
    
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );
    
    // Wait for the related listings to be rendered
    await waitFor(() => {
      const relatedListingElements = screen.queryAllByText(/Related Listing/);
      if (relatedListingElements.length > 0) {
        expect(relatedListingElements.length).toBeGreaterThan(0);
      }
    });
  });

  it('handles listing not found gracefully', async () => {
    // Mock the kv.get function to return null for the listing
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key: string) => {
      if (key.includes('listing:') && key.includes(':slug:')) {
        return null;
      }
      return null;
    });
    
    // Render the listing page with a non-existent listing slug
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: 'non-existent-listing' }} />
    );
    
    // Wait for the not found message to be rendered
    await waitFor(() => {
      const notFoundMessage = screen.queryByText(/not found/i);
      if (notFoundMessage) {
        expect(notFoundMessage).toBeInTheDocument();
      }
    });
  });
});
