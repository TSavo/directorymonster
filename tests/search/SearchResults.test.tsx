/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchResults from '@/components/search/SearchResults';
import { SiteConfig, Listing, Category } from '@/types';
import '@testing-library/jest-dom';

// Mock the ListingCard component
jest.mock('../../src/components/ListingCard', () => {
  return function MockListingCard({ listing }: { listing: Listing }) {
    return (
      <div data-testid="mock-listing-card" data-listing-id={listing.id}>
        <h3>{listing.title}</h3>
        <p>{listing.metaDescription}</p>
      </div>
    );
  };
});

// Mock the SearchFilters component
jest.mock('../../src/components/search/filters/SearchFilters', () => {
  return function MockSearchFilters({ onFilterChange, initialFilters }: any) {
    return (
      <div data-testid="mock-search-filters">
        <button 
          onClick={() => onFilterChange({ categoryId: 'cat2' })}
          data-testid="filter-category-button"
        >
          Filter by Category
        </button>
        <button 
          onClick={() => onFilterChange({ featured: true })}
          data-testid="filter-featured-button"
        >
          Filter Featured
        </button>
        <button 
          onClick={() => onFilterChange({ sortBy: 'newest' })}
          data-testid="filter-sort-button"
        >
          Sort by Newest
        </button>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('SearchResults Component', () => {
  // Sample data for testing
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

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Business',
      slug: 'business',
      parentId: null,
      siteId: 'site1',
      metaDescription: 'Business category description',
      featuredImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'cat2',
      name: 'Technology',
      slug: 'technology',
      parentId: null,
      siteId: 'site1',
      metaDescription: 'Technology category description',
      featuredImage: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  const mockListings: Listing[] = Array.from({ length: 15 }, (_, i) => ({
    id: `listing${i + 1}`,
    siteId: 'site1',
    categoryId: i < 10 ? 'cat1' : 'cat2',
    categorySlug: i < 10 ? 'business' : 'technology',
    title: `Test Listing ${i + 1}`,
    slug: `test-listing-${i + 1}`,
    metaDescription: `This is description for test listing ${i + 1}`,
    content: `Content for test listing ${i + 1}`,
    imageUrl: `/images/test-${i + 1}.jpg`,
    backlinkUrl: `https://example.com/${i + 1}`,
    backlinkAnchorText: `Visit Site ${i + 1}`,
    backlinkPosition: 'prominent',
    backlinkType: 'dofollow',
    featured: i % 3 === 0,
    status: i % 4 === 0 ? 'draft' : 'published',
    customFields: {},
    createdAt: Date.now() - (i * 86400000), // Each a day apart
    updatedAt: Date.now()
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
  });

  it('shows loading state initially', async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applies filter for category and updates API request', async () => {
    // First request returns normal results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(0, 5),
        pagination: {
          page: 1,
          perPage: 10,
          totalResults: 5,
          totalPages: 1
        },
        query: 'test query'
      })
    });
    
    // Second request after filtering returns filtered results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(10, 13),
        pagination: {
          page: 1,
          perPage: 10,
          totalResults: 3,
          totalPages: 1
        },
        query: 'test query',
        filters: {
          categoryId: 'cat2'
        }
      })
    });
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
        categories={mockCategories}
      />
    );
    
    // Wait for initial results to load
    await waitFor(() => {
      expect(screen.getByText('Search Results for "test query"')).toBeInTheDocument();
    });
    
    // Check that the filter component is rendered
    expect(screen.getByTestId('mock-search-filters')).toBeInTheDocument();
    
    // Apply category filter
    fireEvent.click(screen.getByTestId('filter-category-button'));
    
    // Wait for filtered results to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    // Verify correct API call with filters - accept either format depending on implementation
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringMatching(/\/api\/search\?q=test\+query(&siteId=site1)?(&categoryId=cat2)/)
    );
  });

  it('handles pagination with the new API response format', async () => {
    // Mock response with pagination info
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(0, 10),
        pagination: {
          page: 1,
          perPage: 10,
          totalResults: 15,
          totalPages: 2
        },
        query: 'test query'
      })
    });
    
    // Second page response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(10, 15),
        pagination: {
          page: 2,
          perPage: 10,
          totalResults: 15,
          totalPages: 2
        },
        query: 'test query'
      })
    });
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Search Results for "test query"')).toBeInTheDocument();
    });
    
    // Go to page 2
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    // Verify API call with page parameter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    expect(global.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('page=2')
    );
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    expect(screen.getByText('API error')).toBeInTheDocument();
  });
});
