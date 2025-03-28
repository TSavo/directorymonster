/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SearchResults from '../../src/components/search/SearchResults';
import { SiteConfig, Listing } from '../../src/types';
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

// Mock fetch for API calls
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

  const mockListings: Listing[] = Array.from({ length: 15 }, (_, i) => ({
    id: `listing${i + 1}`,
    siteId: 'site1',
    categoryId: 'cat1',
    categorySlug: 'test-category',
    title: `Test Listing ${i + 1}`,
    slug: `test-listing-${i + 1}`,
    metaDescription: `This is description for test listing ${i + 1}`,
    content: `Content for test listing ${i + 1}`,
    imageUrl: `/images/test-${i + 1}.jpg`,
    backlinkUrl: `https://example.com/${i + 1}`,
    backlinkAnchorText: `Visit Site ${i + 1}`,
    backlinkPosition: 'prominent',
    backlinkType: 'dofollow',
    customFields: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset scroll position mock
    window.scrollTo = jest.fn();
  });

  it('shows loading state initially', async () => {
    // Mock successful API response but don't resolve yet
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    // Check for loading state
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('Searching...');
    
    // Loading spinner should be visible
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays search results after successful API call', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(0, 5),
        totalResults: 5,
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
    
    // Check results count is displayed
    expect(screen.getByText('5 results found')).toBeInTheDocument();
    
    // Check that listing cards are rendered
    const listingCards = screen.getAllByTestId('mock-listing-card');
    expect(listingCards).toHaveLength(5);
    
    // Check specific listing titles are present
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 5')).toBeInTheDocument();
    
    // Pagination shouldn't be visible for 5 results (less than page size)
    const prevButton = screen.queryByText('Previous');
    const nextButton = screen.queryByText('Next');
    expect(prevButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
  });

  it('handles pagination for large result sets', async () => {
    // Mock successful API response with many results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings,
        totalResults: mockListings.length,
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
    
    // Check results count is displayed
    expect(screen.getByText(`${mockListings.length} results found`)).toBeInTheDocument();
    
    // First page of results
    const firstPageListingCards = screen.getAllByTestId('mock-listing-card');
    expect(firstPageListingCards).toHaveLength(10); // Default is 10 per page
    
    // Check pagination is visible
    const prevButton = screen.getByText('Previous');
    const nextButton = screen.getByText('Next');
    const page1Button = screen.getByText('1');
    const page2Button = screen.getByText('2');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(page1Button).toBeInTheDocument();
    expect(page2Button).toBeInTheDocument();
    
    // Prev button should be disabled on first page
    expect(prevButton).toHaveClass('bg-gray-100 text-gray-400 cursor-not-allowed');
    
    // Page 1 should be active
    expect(page1Button).toHaveClass('bg-blue-500 text-white');
    
    // Go to page 2
    fireEvent.click(page2Button);
    
    // Page 2 should now be active
    expect(page2Button).toHaveClass('bg-blue-500 text-white');
    
    // Next button should be disabled on last page
    expect(nextButton).toHaveClass('bg-gray-100 text-gray-400 cursor-not-allowed');
    
    // Second page of results
    const secondPageListingCards = screen.getAllByTestId('mock-listing-card');
    expect(secondPageListingCards).toHaveLength(5); // 15 total, 10 on first page, 5 on second
    
    // First page listings should not be visible
    expect(screen.queryByText('Test Listing 1')).not.toBeInTheDocument();
    
    // Second page listings should be visible
    expect(screen.getByText('Test Listing 11')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 15')).toBeInTheDocument();
    
    // Go back to page 1
    fireEvent.click(page1Button);
    
    // First page listings should be visible again
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Test Listing 10')).toBeInTheDocument();
  });

  it('displays no results message when API returns empty results', async () => {
    // Mock API response with no results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [],
        totalResults: 0,
        query: 'no results query'
      })
    });
    
    render(
      <SearchResults 
        query="no results query" 
        site={mockSite}
      />
    );
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Search Results for "no results query"')).toBeInTheDocument();
    });
    
    // Check for no results message
    expect(screen.getByText('No results found for "no results query"')).toBeInTheDocument();
    expect(screen.getByText('Try different keywords or check your spelling')).toBeInTheDocument();
    
    // No listing cards should be rendered
    const listingCards = screen.queryAllByTestId('mock-listing-card');
    expect(listingCards).toHaveLength(0);
    
    // No pagination should be visible
    const pagination = screen.queryByText('Previous');
    expect(pagination).not.toBeInTheDocument();
  });

  it('displays error message when API call fails', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    // Check that error message is displayed
    expect(screen.getByText('API error')).toBeInTheDocument();
    
    // No listing cards should be rendered
    const listingCards = screen.queryAllByTestId('mock-listing-card');
    expect(listingCards).toHaveLength(0);
  });

  it('passes the site ID to API when provided', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings.slice(0, 5),
        totalResults: 5,
        query: 'test query'
      })
    });
    
    render(
      <SearchResults 
        query="test query"
        siteId="site1" 
        site={mockSite}
      />
    );
    
    // Wait for fetch to be called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Verify the site ID is included in the API call
    expect(global.fetch).toHaveBeenCalledWith('/api/search?q=test+query&siteId=site1');
  });

  it('scrolls to top when changing pages', async () => {
    // Mock successful API response with many results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings,
        totalResults: mockListings.length,
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
    
    // Verify scrollTo was called with correct arguments
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('correctly handles next/prev button clicks', async () => {
    // Mock successful API response with many results
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: mockListings,
        totalResults: mockListings.length,
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
    
    // Go to page 2 using Next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Now on page 2, Prev button should be active
    const prevButton = screen.getByText('Previous');
    expect(prevButton).not.toHaveClass('cursor-not-allowed');
    
    // Second page listings should be visible
    expect(screen.getByText('Test Listing 11')).toBeInTheDocument();
    
    // Go back to page 1 using Prev button
    fireEvent.click(prevButton);
    
    // Now on page 1, first page listings should be visible
    expect(screen.getByText('Test Listing 1')).toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error'
    });
    
    render(
      <SearchResults 
        query="test query" 
        site={mockSite}
      />
    );
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
    
    // Check that error message is displayed
    expect(screen.getByText('Failed to load search results')).toBeInTheDocument();
  });
});
