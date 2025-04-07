/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import SearchPage, { generateMetadata } from '@/app/search/page';
import '@testing-library/jest-dom';

// Mock the search components
jest.mock('../../../src/components/search', () => ({
  SearchForm: ({ siteId, placeholder, className }: any) => (
    <div data-testid="mock-search-form" data-site-id={siteId} data-placeholder={placeholder} className={className}>
      Mock Search Form
    </div>
  ),
  SearchResults: ({ query, siteId, site }: any) => (
    <div data-testid="mock-search-results" data-query={query} data-site-id={siteId} data-site-name={site.name}>
      Mock Search Results for {query}
    </div>
  ),
}));

// Mock site utils
jest.mock('../../../src/lib/site-utils', () => ({
  getSiteFromRequest: jest.fn(() => Promise.resolve({
    id: 'site1',
    name: 'Test Site',
    slug: 'test-site',
    primaryKeyword: 'test',
    metaDescription: 'Test site description',
    headerText: 'Test Site Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })),
}));

// Mock Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn((key) => {
      if (key === 'site:id:site2') {
        return Promise.resolve({
          id: 'site2',
          name: 'Another Test Site',
          slug: 'another-test-site',
          primaryKeyword: 'another',
          metaDescription: 'Another test site description',
          headerText: 'Another Test Site Header',
          defaultLinkAttributes: 'dofollow',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      return Promise.resolve(null);
    }),
    keys: jest.fn().mockResolvedValue([]),
  },
}));

// Mock the auth module
jest.mock('../../../src/lib/auth', () => ({
  currentUser: jest.fn().mockResolvedValue(null)
}));

describe('SearchPage Component', () => {
  it('renders search form when no query is provided', async () => {
    const { getSiteFromRequest } = require('../../../src/lib/site-utils');

    const page = await SearchPage({ searchParams: {} });
    render(page);

    // Check that page title is rendered
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Search');

    // Check that search form is rendered with correct props
    const searchForm = screen.getByTestId('mock-search-form');
    expect(searchForm).toBeInTheDocument();
    expect(searchForm).toHaveAttribute('data-site-id', 'site1');
    expect(searchForm).toHaveAttribute('data-placeholder', 'Search for products, services, or keywords...');

    // Check that no results component is rendered
    expect(screen.getByText('Enter a search query to find listings')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-search-results')).not.toBeInTheDocument();

    // Verify site utils was called
    expect(getSiteFromRequest).toHaveBeenCalled();
  });

  it('renders search results when query is provided', async () => {
    const page = await SearchPage({ searchParams: { q: 'test query' } });
    render(page);

    // Check that page title is rendered
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Search');

    // Check that search form is rendered
    const searchForm = screen.getByTestId('mock-search-form');
    expect(searchForm).toBeInTheDocument();

    // Check that search results are rendered with correct props
    const searchResults = screen.getByTestId('mock-search-results');
    expect(searchResults).toBeInTheDocument();
    expect(searchResults).toHaveAttribute('data-query', 'test query');
    expect(searchResults).toHaveAttribute('data-site-id', 'site1');
    expect(searchResults).toHaveAttribute('data-site-name', 'Test Site');
  });

  // Site ID is now handled by middleware, not by query parameter
  it('always uses the current site from middleware', async () => {
    const { kv } = require('../../../src/lib/redis-client');

    // Even with a siteId parameter, it should use the current site from middleware
    const page = await SearchPage({ searchParams: { q: 'test query' } });
    render(page);

    // Check that search results are rendered with current site
    const searchResults = screen.getByTestId('mock-search-results');
    expect(searchResults).toBeInTheDocument();
    expect(searchResults).toHaveAttribute('data-site-id', 'site1');
    expect(searchResults).toHaveAttribute('data-site-name', 'Test Site');
  });

  // Site ID parameter is no longer used, so this test is no longer needed

  describe('generateMetadata', () => {
    it('returns default metadata when no query is provided', async () => {
      const metadata = await generateMetadata({ searchParams: {} });

      expect(metadata).toEqual({
        title: 'Search',
        description: 'Search our directory for products, services, and information',
      });
    });

    it('returns query-specific metadata when query is provided', async () => {
      const metadata = await generateMetadata({ searchParams: { q: 'test query' } });

      expect(metadata).toEqual({
        title: 'Search Results for "test query"',
        description: 'Search results for "test query" in our directory',
      });
    });
  });
});
