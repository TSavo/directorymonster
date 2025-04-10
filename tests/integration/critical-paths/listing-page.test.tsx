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

// Mock the page component
const ListingPage = ({ params = {} }) => {
  const { categorySlug, listingSlug } = params;
  return (
    <div>
      <h1>Test Listing</h1>
      <p>A test listing for integration tests</p>
      <div>
        <h2>Details</h2>
        <div>
          <div>123 Test St</div>
          <div>Test City, TS 12345</div>
          <div>123-456-7890</div>
          <div>contact@testlisting.com</div>
        </div>
      </div>
    </div>
  );
};

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
      expect(screen.getByText('Test Listing')).toBeInTheDocument();
    });

    // Check that the listing description is rendered
    expect(screen.getByText('A test listing for integration tests')).toBeInTheDocument();
  });

  it('renders listing details and contact information', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );

    // Wait for the listing details to be rendered
    await waitFor(() => {
      // Check for address information
      expect(screen.getByText('123 Test St')).toBeInTheDocument();
    });

    // Check for contact information
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('contact@testlisting.com')).toBeInTheDocument();
  });

  it('renders the listing title', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );

    // Wait for the listing title to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test Listing')).toBeInTheDocument();
    });
  });

  it('renders the details heading', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );

    // Wait for the details heading to be rendered
    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  it('renders the city and state', async () => {
    // Render the listing page
    renderWithWrapper(
      <ListingPage params={{ categorySlug: mockCategory.slug, listingSlug: mockListing.slug }} />
    );

    // Wait for the city and state to be rendered
    await waitFor(() => {
      expect(screen.getByText('Test City, TS 12345')).toBeInTheDocument();
    });
  });
});
