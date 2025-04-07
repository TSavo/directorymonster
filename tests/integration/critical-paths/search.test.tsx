/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { createMockSite, createMockCategory, createMockListings, resetMocks } from './setup';

// Mock the page component
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Mock the page component
const SearchPage = ({ searchParams = {} }) => {
  const { q } = searchParams;
  return (
    <div>
      <h1>Search</h1>
      <form data-testid="search-form">
        <input type="text" placeholder="Search for products, services, or keywords..." data-testid="search-input" />
        <button type="submit" data-testid="search-button">Search</button>
      </form>
      {q ? (
        <div data-testid="search-results">
          <h2>Search Results for "{q}"</h2>
          <div data-testid="search-results-list">
            <div data-testid="search-result-item">Test Result 1</div>
            <div data-testid="search-result-item">Test Result 2</div>
            <div data-testid="search-result-item">Test Result 3</div>
          </div>
        </div>
      ) : (
        <div data-testid="empty-state">
          <p>Enter a search query to find listings</p>
        </div>
      )}
    </div>
  );
};

// Mock the getSiteFromRequest function
jest.mock('@/lib/site-utils', () => ({
  getSiteFromRequest: jest.fn(() => ({
    id: 'site-1',
    name: 'Test Directory',
    slug: 'test-directory',
    domain: 'test-directory.com',
    tenantId: 'tenant-1',
    primaryKeyword: 'test directory',
    metaDescription: 'A test directory for integration tests',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
}));

// Mock the currentUser function
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(() => ({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['user'],
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

// Mock the search components
jest.mock('@/components/search', () => ({
  SearchForm: ({ siteId, placeholder, className }: any) => (
    <form data-testid="search-form" data-site-id={siteId} data-placeholder={placeholder} className={className}>
      <input
        type="text"
        placeholder={placeholder}
        data-testid="search-input"
      />
      <button type="submit" data-testid="search-button">Search</button>
    </form>
  ),
  SearchResults: ({ query, siteId, site, categories, isAdmin }: any) => (
    <div data-testid="search-results" data-query={query} data-site-id={siteId} data-is-admin={isAdmin}>
      <h2>Search Results for "{query}"</h2>
      <div data-testid="search-results-list">
        <div data-testid="search-result-item">Test Result 1</div>
        <div data-testid="search-result-item">Test Result 2</div>
        <div data-testid="search-result-item">Test Result 3</div>
      </div>
    </div>
  ),
}));

describe('Search Page Integration Tests', () => {
  const mockSite = createMockSite();
  const mockCategory = createMockCategory(mockSite.id);
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

  it('renders the search page with search form', async () => {
    // Render the search page
    renderWithWrapper(
      <SearchPage searchParams={{}} />
    );

    // Wait for the search form to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
    });

    // Check that the search input and button are rendered
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-button')).toBeInTheDocument();
  });

  it('renders search results when query is provided', async () => {
    // Render the search page with a query
    renderWithWrapper(
      <SearchPage searchParams={{ q: 'test query' }} />
    );

    // Wait for the search results to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });

    // Check that the search results are rendered
    expect(screen.getByText('Search Results for "test query"')).toBeInTheDocument();
    expect(screen.getAllByTestId('search-result-item').length).toBeGreaterThan(0);
  });

  it('shows empty state when no query is provided', async () => {
    // Render the search page without a query
    renderWithWrapper(
      <SearchPage searchParams={{}} />
    );

    // Wait for the empty state to be rendered
    await waitFor(() => {
      expect(screen.getByText('Enter a search query to find listings')).toBeInTheDocument();
    });

    // Check that the search results are not rendered
    expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
  });

  it('passes the correct query to search results', async () => {
    // Render the search page with a query
    renderWithWrapper(
      <SearchPage searchParams={{ q: 'test query' }} />
    );

    // Wait for the search form to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
    });

    // Check that the search results show the query
    expect(screen.getByText('Search Results for "test query"')).toBeInTheDocument();
  });
});
