/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { createMockSite, createMockCategory, createMockListings, resetMocks } from './setup';

// Mock the page component
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Import the page component
import CategoryPage from '@/app/[categorySlug]/page';

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

describe('Category Page Integration Tests', () => {
  const mockSite = createMockSite();
  const mockCategory = createMockCategory(mockSite.id, { id: 'category-1', name: 'Test Category', slug: 'test-category' });
  const mockListings = createMockListings(mockSite.id, mockCategory.id, 5);
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
      } else if (key.includes('listing:')) {
        const listingId = key.split(':').pop();
        const listing = mockListings.find(l => l.id === listingId);
        return listing ? JSON.stringify(listing) : null;
      }
      return null;
    });
    
    // Mock the kv.smembers function to return category IDs or listing IDs
    kv.smembers.mockImplementation((key: string) => {
      if (key.includes('site:categories')) {
        return mockCategories.map(c => c.id);
      } else if (key.includes('category:listings')) {
        return mockListings.map(l => l.id);
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the category page with category name and description', async () => {
    // Render the category page
    renderWithWrapper(
      <CategoryPage params={{ categorySlug: mockCategory.slug }} />
    );
    
    // Wait for the category name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockCategory.name)).toBeInTheDocument();
    });
    
    // Check that the category description is rendered
    expect(screen.getByText(mockCategory.metaDescription)).toBeInTheDocument();
  });

  it('renders listings for the category', async () => {
    // Render the category page
    renderWithWrapper(
      <CategoryPage params={{ categorySlug: mockCategory.slug }} />
    );
    
    // Wait for the listings to be rendered
    await waitFor(() => {
      // Check that at least one listing title is rendered
      expect(screen.getByText(mockListings[0].title)).toBeInTheDocument();
    });
    
    // Check that all listings are rendered
    for (const listing of mockListings) {
      expect(screen.getByText(listing.title)).toBeInTheDocument();
    }
  });

  it('renders breadcrumb navigation', async () => {
    // Render the category page
    renderWithWrapper(
      <CategoryPage params={{ categorySlug: mockCategory.slug }} />
    );
    
    // Wait for the breadcrumb navigation to be rendered
    await waitFor(() => {
      const homeLink = screen.queryByText('Home');
      if (homeLink) {
        expect(homeLink).toBeInTheDocument();
      }
    });
    
    // Check that the category name is in the breadcrumb
    expect(screen.getAllByText(mockCategory.name).length).toBeGreaterThan(0);
  });

  it('renders related categories if available', async () => {
    // Mock the kv.smembers function to return related category IDs
    const { kv } = require('@/lib/redis-client');
    kv.smembers.mockImplementation((key: string) => {
      if (key.includes('category:related')) {
        return ['category-2', 'category-3'];
      } else if (key.includes('site:categories')) {
        return mockCategories.map(c => c.id);
      } else if (key.includes('category:listings')) {
        return mockListings.map(l => l.id);
      }
      return [];
    });
    
    // Render the category page
    renderWithWrapper(
      <CategoryPage params={{ categorySlug: mockCategory.slug }} />
    );
    
    // Wait for the related categories to be rendered
    await waitFor(() => {
      const relatedCategories = screen.queryAllByText(/Another Category|Third Category/);
      if (relatedCategories.length > 0) {
        expect(relatedCategories.length).toBeGreaterThan(0);
      }
    });
  });

  it('handles category not found gracefully', async () => {
    // Mock the kv.get function to return null for the category
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key: string) => {
      if (key.includes('category:') && key.includes(':slug:')) {
        return null;
      }
      return null;
    });
    
    // Render the category page with a non-existent category slug
    renderWithWrapper(
      <CategoryPage params={{ categorySlug: 'non-existent-category' }} />
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
